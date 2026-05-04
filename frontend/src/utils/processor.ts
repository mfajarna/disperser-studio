import * as Tone from 'tone';

export const processAudio = async (
  buffer: AudioBuffer,
  options: {
    volume: number;
    speed: number;
    pitch: number;
    trimStart: number;
    trimEnd: number;
  }
) => {
  const { volume, speed, pitch, trimStart, trimEnd } = options;
  const duration = (trimEnd - trimStart) / speed;

  return await Tone.Offline(async () => {
    const source = new Tone.BufferSource(buffer);
    const vol = new Tone.Volume(Tone.gainToDb(volume)).toDestination();
    const shift = new Tone.PitchShift(pitch).connect(vol);
    
    source.connect(shift);
    source.playbackRate = speed;
    source.start(0, trimStart, trimEnd - trimStart);
  }, duration);
};
