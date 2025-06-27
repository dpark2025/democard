// ==============================================================================
// Protracker replay routine in JavaScript (one file edition)
// Copyright (C) 2012-2016 Noora Halme
// Licensed under the MIT license
// ==============================================================================

var Protracker=function() {

  // parser for protracker module files
  this.parse=function(buffer) {
    var i,j,c;
    this.title="";

    // check that we have enough data
    if (buffer.length<1084) {
      this.clearsong();
      return false;
    }

    var dv=new DataView(buffer);

    // parse title
    for(i=0; i<20; i++) {
      var b=dv.getUint8(i);
      if (b==0) break;
      this.title += String.fromCharCode(b);
    }

    // parse sample information
    var samplesize=0;
    for(i=0; i<31; i++) {
      var st=dv.getUint8(20+i*30+22)&0xf0;
      this.sample[i]={
        'name': '',
        'length': dv.getUint16(20+i*30+22)<<1,
        'finetune': dv.getUint8(20+i*30+24)&0x0f,
        'volume': dv.getUint8(20+i*30+25)&0x7f,
        'repeatpoint': dv.getUint16(20+i*30+26)<<1,
        'repeatlength': dv.getUint16(20+i*30+28)<<1
      };

      // parse sample name
      for(j=0; j<22; j++) {
        var b=dv.getUint8(20+i*30+j);
        if (b==0) break;
        this.sample[i].name += String.fromCharCode(b);
      }

      // fix replen
      if (this.sample[i].repeatlength<=2) {
        this.sample[i].repeatpoint=0;
        this.sample[i].repeatlength=0;
      }

      // empty samples have length 0
      if (this.sample[i].length<=2)
        this.sample[i].length=0;

      samplesize+=this.sample[i].length;
    }

    // module length in patterns
    this.songlen=dv.getUint8(950);
    this.restart=dv.getUint8(951); // not used

    // parse pattern list
    this.songpatterns=[];
    for(i=0; i<128; i++) {
      this.songpatterns[i]=dv.getUint8(952+i);
    }

    // four-character tag
    var tag=String.fromCharCode(dv.getUint8(1080), dv.getUint8(1081), dv.getUint8(1082), dv.getUint8(1083));

    // M.K. means 4 channels
    if (tag=="M.K." || tag=="FLT4") this.channels=4;

    // FLT8 means 8 channels
    else if (tag=="FLT8" || tag=="8CHN") this.channels=8;

    // 6CHN means 6 channels
    else if (tag=="6CHN") this.channels=6;

    // xxCH / xxCN means xx channels (11-32)
    else if (tag.charCodeAt(2)==67 && tag.charCodeAt(3)==72) this.channels=parseInt(tag.substring(0,2));
    else if (tag.charCodeAt(2)==67 && tag.charCodeAt(3)==78) this.channels=parseInt(tag.substring(0,2));

    // if still undefined, default to 4 channels
    else this.channels=4;

    // count number of patterns
    this.patterns=0;
    for(i=0; i<this.songlen; i++) {
      if (this.songpatterns[i] > this.patterns)
        this.patterns=this.songpatterns[i];
    }
    this.patterns++;

    // parse pattern data
    this.note=[];
    var patternlen=64*this.channels*4;
    for(i=0; i<this.patterns; i++) {
      this.note[i]=[];
      for(j=0; j<64*this.channels; j++) {
        var offset=1084+i*patternlen+j*4;
        var period=(dv.getUint8(offset)&0x0f)<<8 | dv.getUint8(offset+1);
        var sample=(dv.getUint8(offset)&0xf0) | ((dv.getUint8(offset+2)&0xf0)>>4);
        var effect=dv.getUint8(offset+2)&0x0f;
        var effectdata=dv.getUint8(offset+3)&0xff;
        this.note[i][j]={ 'period': period, 'sample': sample, 'effect': effect, 'effectdata': effectdata };
      }
    }

    // parse sample data
    var samplestart=1084+this.patterns*patternlen;
    for(i=0; i<31; i++) {
      this.sample[i].data=new Float32Array(this.sample[i].length);
      for(j=0; j<this.sample[i].length; j++) {
        var b=dv.getInt8(samplestart);
        this.sample[i].data[j]=b/128.0;
        samplestart++;
      }
    }

    this.mixer.samplerate=Protracker.prototype.samplerate;
    return true;
  }

  // initialize all player variables to defaults prior to starting playback
  this.initialize=function() {
    this.syncqueue=[];

    this.tick=6;
    this.position=0;
    this.row=0;
    this.offset=0;
    this.speed=6;
    this.bpm=125;

    this.patterndelay=0;
    this.patternwait=0;

    this.endofsong=false;

    this.channel=[];
    for(var i=0; i<this.channels; i++) {
      this.channel[i]={
        'sample': 0,
        'finetune': 0,
        'volume': 64,
        'period': 214,

        'voiceperiod': 214,
        'voicevolume': 0,
        'voicesample': 0,
        'voicesamplepos': 0,
        'voicesamplespeed': 0,

        'note': 24,
        'command': 0,
        'data': 0,
        'samplepos': 0,
        'samplespeed': 0,
        'flags': 0,

        'vibratopos': 0,
        'vibratodepth': 1,
        'vibratorate': 1,
        'vibratotype': 0,

        'tremolopos': 0,
        'tremolodepth': 1,
        'tremolorate': 1,
        'tremolotype': 0,

        'waveform': 0,

        'glissando': 0,
        'funkspeed': 0,
        'funkoffset': 0,

        'cut': 0,
        'delay': 0,

        'patternloop': 0,
      };
    }
    this.mixer.initialize();
  }

  // advance player by a single frame
  this.advance=function() {
    var i,ch,panning=0,c;

    this.frame++;
    this.syncqueue.splice(0);

    if (!this.endofsong) {
      if (this.patterndelay) { // delay pattern
        this.patternwait--;
        if (this.patternwait<=0) this.patterndelay=0;
      } else {
        if (this.tick==0) {
          // new row on every zeroth tick
          this.parserow();
          this.tick=this.speed;
          this.row++;
          if (this.row>=64) {
            this.position++;
            this.row=0;
            if (this.position>=this.songlen) {
              this.endofsong=true;
            }
          }
        }
        for(ch=0; ch<this.channels; ch++) {
          this.channel[ch].flags=0;
          this.effects(ch);
          this.updateperiod(ch);
          this.updatevolume(ch);
        }
        this.tick--;
      }
    }

    // mix channels to output buffer
    this.mixer.mix(this.mixval);

    // update mixer return value
    for(i=0; i<this.mixval.length; i++) this.mixval[i]=0.0;
    for(ch=0; ch<this.channels; ch++) {
      if (this.channel[ch].voicesample>0 && this.channel[ch].voicesample<32) {
        var s=this.channel[ch];
        var newsample=this.stepper(ch);
        var vol=s.voicevolume/64.0;

        // hard panning
        if (this.channels==4) {
          panning=(ch&1)?-0.7:0.7;
        } else {
          panning=(2.0*ch/(this.channels-1))-1.0;
        }

        this.mixval[0]+=newsample*vol*(1-panning)*0.5;
        this.mixval[1]+=newsample*vol*(1+panning)*0.5;
      }
    }
  }

  // parse row at current position
  this.parserow=function() {
    var i, c, ch, param;
    this.row=this.row&63;

    var p=this.songpatterns[this.position];
    for(ch=0; ch<this.channels; ch++) {
      c=this.note[p][this.row*this.channels+ch];
      this.channel[ch].command=c.effect;
      this.channel[ch].data=c.effectdata;

      if (c.period>0 && c.sample>0) {
        this.channel[ch].sample=c.sample;
        this.channel[ch].period=c.period;

        this.channel[ch].flags|=3; // recalc speed
        this.channel[ch].vibratopos=0;
        this.channel[ch].tremolopos=0;
        this.channel[ch].funkoffset=0;
        this.channel[ch].samplepos=0;

        if (this.channel[ch].waveform&0x04) this.channel[ch].vibratopos=0;
        if (this.channel[ch].waveform&0x40) this.channel[ch].tremolopos=0;

        var np=this.channel[ch].period;
        for(i=0; i<8*12; i++) {
          if (this.periodtable[i]>=np) break;
        }
        this.channel[ch].note=i;

        if (this.channel[ch].command!=3 && this.channel[ch].command!=5) {
          this.channel[ch].voicesample=this.channel[ch].sample;
          this.channel[ch].voicesamplepos=0;
        }
        if (this.channel[ch].command!=3 && this.channel[ch].command!=5) {
          this.channel[ch].voiceperiod=this.channel[ch].period;
          this.channel[ch].flags|=1;
        }
      }

      // copy sample number only
      if (c.period==0 && c.sample>0) {
        this.channel[ch].sample=c.sample;
        this.channel[ch].voicesample=this.channel[ch].sample;
        this.channel[ch].voicesamplepos=0;
      }

      // recalc sample speed
      if (this.channel[ch].flags&2) {
        this.channel[ch].voicesamplespeed=this.calcspeed(this.channel[ch].voiceperiod);
      }

      this.channel[ch].cut=0;
      this.channel[ch].delay=0;

      param=this.channel[ch].data;

      // parse extended commands (0x0e)
      if (this.channel[ch].command==0x0e) {
        this.channel[ch].command=0xe0|(param>>4);
        this.channel[ch].data=param&0x0f;
      }

      // parse extended commands (0x0f)
      if (this.channel[ch].command==0x0f) {
        if (param<0x20) {
          this.speed=param;
        } else {
          this.bpm=param;
        }
      }

      // handle retrig note
      if (this.channel[ch].command==0xe9) {
        if (param!=0) this.channel[ch].retrig=param;
      }

      // handle cut
      if (this.channel[ch].command==0xec) {
        if (param<this.speed) this.channel[ch].cut=param;
      }

      // handle delay
      if (this.channel[ch].command==0xed) {
        if (param<this.speed) this.channel[ch].delay=param;
      }

      // handle pattern delay
      if (this.channel[ch].command==0xee) {
        if (this.patterndelay==0) {
          this.patterndelay++;
          this.patternwait=param;
        }
      }

      // invert loop
      if (this.channel[ch].command==0xef) {
        this.channel[ch].funkspeed=param;
      }

      // handle normal notes
      if (c.period>0 && c.sample>0) {
        if (this.channel[ch].delay==0) {
          this.playvoice(ch);
        }
      }
    }
  }

  // play voice, handle sample triggering
  this.playvoice=function(ch) {
    var s=this.channel[ch];
    if (s.sample>0 && s.sample<32) {
      s.voicevolume=this.sample[s.sample].volume;
      s.finetune=this.sample[s.sample].finetune;
    }
  }

  // tick player forward
  this.effects=function(ch) {
    var s=this.channel[ch];
    var param=s.data;

    // retrig note
    if (s.command==0xe9) {
      if (s.retrig!=0) {
        if ((this.tick%s.retrig)==0) this.playvoice(ch);
      }
    }

    // cut sample
    if (s.cut==this.tick) s.voicevolume=0;

    // delay sample
    if (s.delay==this.tick) {
      this.playvoice(ch);
    }

    // arpeggio
    if (s.command==0x00 && param>0) {
      var apn=this.tick%3;
      if (apn==0) s.voiceperiod=s.period;
      if (apn==1) s.voiceperiod=this.periodtable[s.note+(param>>4)];
      if (apn==2) s.voiceperiod=this.periodtable[s.note+(param&0x0f)];
      s.flags|=1;
    }

    // portamento up
    if (s.command==0x01) {
      s.period-=param;
      if (s.period<113) s.period=113;
      s.voiceperiod=s.period;
      s.flags|=1;
    }

    // portamento down
    if (s.command==0x02) {
      s.period+=param;
      if (s.period>856) s.period=856;
      s.voiceperiod=s.period;
      s.flags|=1;
    }

    // portamento to note
    if (s.command==0x03) {
      if (s.period<s.periodtarget) {
        s.period+=s.portaspeed;
        if (s.period>s.periodtarget) s.period=s.periodtarget;
      }
      if (s.period>s.periodtarget) {
        s.period-=s.portaspeed;
        if (s.period<s.periodtarget) s.period=s.periodtarget;
      }
      s.voiceperiod=s.period;
      s.flags|=1;
    }

    // vibrato
    if (s.command==0x04) {
      s.voiceperiod=s.period+this.calcvibrato(s);
      s.flags|=1;
    }

    // portamento + volume slide
    if (s.command==0x05) {
      if (s.period<s.periodtarget) {
        s.period+=s.portaspeed;
        if (s.period>s.periodtarget) s.period=s.periodtarget;
      }
      if (s.period>s.periodtarget) {
        s.period-=s.portaspeed;
        if (s.period<s.periodtarget) s.period=s.periodtarget;
      }
      s.voiceperiod=s.period;
      s.flags|=1;

      if ((param&0x0f)==0) s.volume+=(param>>4);
      if ((param&0xf0)==0) s.volume-=(param&0x0f);
      if (s.volume<0) s.volume=0;
      if (s.volume>64) s.volume=64;
      s.voicevolume=s.volume;
    }

    // vibrato + volume slide
    if (s.command==0x06) {
      s.voiceperiod=s.period+this.calcvibrato(s);
      s.flags|=1;

      if ((param&0x0f)==0) s.volume+=(param>>4);
      if ((param&0xf0)==0) s.volume-=(param&0x0f);
      if (s.volume<0) s.volume=0;
      if (s.volume>64) s.volume=64;
      s.voicevolume=s.volume;
    }

    // tremolo
    if (s.command==0x07) {
      s.voicevolume=s.volume+this.calctremolo(s);
      if (s.voicevolume<0) s.voicevolume=0;
      if (s.voicevolume>64) s.voicevolume=64;
    }

    // set sample offset
    if (s.command==0x09) {
      if (param>0) s.sampleoffset=param;
      s.voicesamplepos=s.sampleoffset<<8;
    }

    // volume slide
    if (s.command==0x0a) {
      if ((param&0x0f)==0) s.volume+=(param>>4);
      if ((param&0xf0)==0) s.volume-=(param&0x0f);
      if (s.volume<0) s.volume=0;
      if (s.volume>64) s.volume=64;
      s.voicevolume=s.volume;
    }

    // position jump
    if (s.command==0x0b) {
      this.position=param-1;
      this.row=64;
    }

    // set volume
    if (s.command==0x0c) {
      if (param<=64) {
        s.volume=param;
        s.voicevolume=param;
      }
    }

    // pattern break
    if (s.command==0x0d) {
      this.row=64;
    }

    // set filter (ignored)
    if (s.command==0xe0) {
    }

    // fineslide up
    if (s.command==0xe1) {
      s.period-=param;
      if (s.period<113) s.period=113;
      s.voiceperiod=s.period;
      s.flags|=1;
    }

    // fineslide down
    if (s.command==0xe2) {
      s.period+=param;
      if (s.period>856) s.period=856;
      s.voiceperiod=s.period;
      s.flags|=1;
    }

    // glissando control
    if (s.command==0xe3) {
      s.glissando=param;
    }

    // set vibrato waveform
    if (s.command==0xe4) {
      s.waveform=(s.waveform&0xf0)|(param&0x0f);
    }

    // set finetune
    if (s.command==0xe5) {
      s.finetune=param;
      s.flags|=1;
    }

    // pattern loop
    if (s.command==0xe6) {
      if (param==0) {
        s.patternloop=this.row;
      } else {
        if (s.patternloopcount==0) s.patternloopcount=param;
        s.patternloopcount--;
        if (s.patternloopcount>0) this.row=s.patternloop-1;
      }
    }

    // set tremolo waveform
    if (s.command==0xe7) {
      s.waveform=(s.waveform&0x0f)|((param&0x0f)<<4);
    }

    // fine volume slide up
    if (s.command==0xea) {
      s.volume+=param;
      if (s.volume>64) s.volume=64;
      s.voicevolume=s.volume;
    }

    // fine volume slide down
    if (s.command==0xeb) {
      s.volume-=param;
      if (s.volume<0) s.volume=0;
      s.voicevolume=s.volume;
    }

    // invert loop
    if (s.command==0xef) {
      if (s.funkspeed>0) {
        s.funkoffset+=this.funk[s.funkspeed];
        if (s.funkoffset>=128) {
          s.funkoffset=0;
          if (s.voicesample>0 && s.voicesample<=31) {
            if (this.sample[s.voicesample].repeatpoint>0 && this.sample[s.voicesample].repeatlength>2) {
              var i=s.voicesamplepos>>0;
              if (i>=this.sample[s.voicesample].repeatpoint && i<(this.sample[s.voicesample].repeatpoint+this.sample[s.voicesample].repeatlength)) {
                this.sample[s.voicesample].data[i]=-this.sample[s.voicesample].data[i];
              }
            }
          }
        }
      }
    }

    // commands that happen on the first tick of every row
    if (this.tick==(this.speed-1)) {

      // portamento to note
      if (s.command==0x03) {
        if (param>0) s.portaspeed=param;
        var period=s.period;
        if (s.periodtarget>0) period=s.periodtarget;
        s.periodtarget=s.period;
        s.period=period;
        s.voiceperiod=s.period;
        s.flags|=1;
      }

      // vibrato
      if (s.command==0x04) {
        if ((param&0x0f)>0) s.vibratodepth=(param&0x0f)<<2;
        if ((param&0xf0)>0) s.vibratorate=(param&0xf0)>>2;
      }

      // portamento + volume slide
      if (s.command==0x05) {
        // same as 0x03
      }

      // vibrato + volume slide
      if (s.command==0x06) {
        // same as 0x04
      }

      // tremolo
      if (s.command==0x07) {
        if ((param&0x0f)>0) s.tremolodepth=(param&0x0f)<<2;
        if ((param&0xf0)>0) s.tremolorate=(param&0xf0)>>2;
      }
    }
  }

  // update period for one channel
  this.updateperiod=function(ch) {
    var s=this.channel[ch];
    if (s.flags&1) {
      s.voicesamplespeed=this.calcspeed(s.voiceperiod, s.finetune);
    }
  }

  // update volume for one channel
  this.updatevolume=function(ch) {
    // nothing here yet
  }

  // calculate vibrato for one channel
  this.calcvibrato=function(s) {
    var waveform=(s.waveform&0x03);
    var val=0;

    if (waveform==0) val=Math.sin(s.vibratopos*Math.PI/32.0); // sine
    if (waveform==1) { // square
      if (s.vibratopos<32) val=1.0; else val=-1.0;
    }
    if (waveform==2) val=1.0-s.vibratopos/32.0; // saw
    if (waveform==3) val=Math.random()*2.0-1.0; // noise

    s.vibratopos=(s.vibratopos+s.vibratorate)&63;
    return (val*s.vibratodepth)>>7;
  }

  // calculate tremolo for one channel
  this.calctremolo=function(s) {
    var waveform=(s.waveform&0x30)>>4;
    var val=0;

    if (waveform==0) val=Math.sin(s.tremolopos*Math.PI/32.0); // sine
    if (waveform==1) { // square
      if (s.tremolopos<32) val=1.0; else val=-1.0;
    }
    if (waveform==2) val=1.0-s.tremolopos/32.0; // saw
    if (waveform==3) val=Math.random()*2.0-1.0; // noise

    s.tremolopos=(s.tremolopos+s.tremolorate)&63;
    return (val*s.tremolodepth)>>6;
  }

  // advance sample position and generate output
  this.stepper=function(ch) {
    var s=this.channel[ch];
    var sample=0.0;
    var si=s.voicesamplepos>>0;
    var sf=s.voicesamplepos-si;

    if (s.voicesample>0 && s.voicesample<=31 && si<this.sample[s.voicesample].length) {
      sample=this.sample[s.voicesample].data[si];

      // linear interpolation
      if (si<(this.sample[s.voicesample].length-1)) {
        sample=sample*(1.0-sf)+this.sample[s.voicesample].data[si+1]*sf;
      }
    }

    s.voicesamplepos+=s.voicesamplespeed;

    // loop or stop sample?
    if (s.voicesample>0 && s.voicesample<=31) {
      if (this.sample[s.voicesample].repeatlength>2) {
        if (si>=this.sample[s.voicesample].repeatpoint+this.sample[s.voicesample].repeatlength) {
          s.voicesamplepos=this.sample[s.voicesample].repeatpoint+(s.voicesamplepos-this.sample[s.voicesample].repeatpoint-this.sample[s.voicesample].repeatlength);
        }
      } else {
        if (si>=this.sample[s.voicesample].length) {
          s.voicesamplepos=this.sample[s.voicesample].length;
          sample=0.0;
        }
      }
    }

    return sample;
  }

  // calculate speed for sample
  this.calcspeed=function(period, finetune) {
    if (finetune==undefined) finetune=0;
    if (period==0) return 0.0;

    // linear interpolation between adjacent entries in the period table
    var lowerbound=113, upperbound=856;
    var findperiod=period;

    // add finetune
    if (finetune!=0) {
      if (finetune>0) findperiod=period+((this.finetune[finetune-1]*period)>>16);
      if (finetune<0) findperiod=period-((this.finetune[-finetune-1]*period)>>16);
    }

    var ft=this.periodtable[0];
    for(var f=0; f<8*12; f++) {
      if (this.periodtable[f]>=lowerbound && this.periodtable[f]<=upperbound) {
        if (this.periodtable[f]<=findperiod) {
          ft=this.periodtable[f];
          break;
        }
      }
    }
    var nt=this.periodtable[f+1];
    if (nt==undefined) nt=this.periodtable[f];

    var p=(findperiod-ft)/(nt-ft);
    var f2=f+p;
    var freq=8363*Math.pow(2, (4*12+39-f2)/12);

    return freq/this.samplerate;
  }

  // clear song data
  this.clearsong=function() {
    this.title="";
    this.sample=[];
    for(var i=0; i<31; i++) this.sample[i]={ 'name': '', 'length': 0, 'finetune': 0, 'volume': 64, 'repeatpoint': 0, 'repeatlength': 0, 'data': new Float32Array(1) };
    this.songlen=1;
    this.songpatterns=[];
    for(var i=0; i<128; i++) this.songpatterns[i]=0;
    this.patterns=0;
    this.note=[];
  }

  // player object constructor
  this.clearsong();
  this.initialize();
  this.samplerate=44100;
  this.frame=0;
  this.tick=0;
  this.speed=6;
  this.bpm=125;
  this.endofsong=false;
  this.mixval=new Float32Array(2);

  this.periodtable=new Uint16Array([
    1712,1616,1525,1440,1357,1281,1209,1141,1077,1017, 961, 907,
     856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
     428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
     214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
     107, 101,  95,  90,  85,  80,  76,  71,  67,  64,  60,  57,
      53,  50,  47,  45,  42,  40,  38,  36,  34,  32,  30,  28,
      27,  25,  24,  22,  21,  20,  19,  18,  17,  16,  15,  14,
      13,  13,  12,  11,  11,  10,   9,   9,   8,   8,   7,   7
  ]);

  this.finetune=new Uint16Array([
    0,74,149,223,298,372,446,521,595,670,744,819,893,967,1042,1116
  ]);

  this.funk=new Uint8Array([
    0,5,6,7,8,10,11,13,16,19,22,26,32,43,64,128
  ]);

  // mixer
  this.mixer={
    'initialize': function() {
      this.volume=0.25;
      this.separation=1;
      this.filter=false;
    },

    'mix': function(adata) {
      // placeholder
    }
  }
}

Protracker.prototype.samplerate=44100;