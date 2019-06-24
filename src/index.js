import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import WebAudioScheduler from 'web-audio-scheduler'

let samples = ['dan', 'dun', 'den', 'dee-dan']

function createBuffers(ctx) {
  return Promise.all(
    samples.map(async s => {
      let response = await fetch(`./${s}.wav`)
      let arrayBuffer = await response.arrayBuffer()
      let buffer = await ctx.decodeAudioData(arrayBuffer)
      return buffer
    }),
  )
}

async function app() {
  let response = await fetch('./hello_world.wav')
  let arrayBuffer = await response.arrayBuffer()

  let ctx = new AudioContext()
  let buffer = await ctx.decodeAudioData(arrayBuffer)
  let buffers = await createBuffers(ctx)

  let play = buffer => event => {
    let src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    src.start(event.playbackTime)
  }

  // document.body.onclick = () =>
  //   play(buffer)({
  //     playbackTime: ctx.currentTime,
  //   })

  window.onkeypress = event =>
    play(buffers[event.keyCode % buffers.lengthd])({
      playbackTime: ctx.currentTime,
    })

  let s = new WebAudioScheduler({ context: ctx })

  let Button = ({ active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? 'blue' : 'black',
        width: 50,
        height: 50,
      }}
    />
  )

  let Sequencer = () => {
    let [sequence, setSequence] = useState(
      samples.map(s =>
        Array(8)
          .fill()
          .map(() => false),
      ),
    )

    function imperialMarch(event) {
      let t = event.playbackTime
      let beat = 60 / 120

      // s.insert(t, play(buffers[0]))
      // s.insert(t + beat * 1, play(buffers[0]))
      // s.insert(t + beat * 2, play(buffers[0]))
      // s.insert(t + beat * 3, play(buffers[1]))
      // s.insert(t + beat * 4, play(buffers[3]))
      // s.insert(t + beat * 5, play(buffers[2]))
      // s.insert(t + beat * 6, play(buffers[3]))

      sequence.forEach((seq, y) => {
        seq.forEach((active, x) => {
          if (active) s.insert(t + beat * x, play(buffers[y]))
        })
      })
    }

    return (
      <>
        {sequence.map((s, y) => (
          <div>
            {s.map((active, x) => (
              <Button
                active={active}
                onClick={() => {
                  setSequence(s =>
                    Object.assign([], s, {
                      [y]: Object.assign([], s[y], { [x]: !s[y][x] }),
                    }),
                  )
                }}
              />
            ))}
          </div>
        ))}
        <hr />
        <button
          onClick={() => {
            s.start(imperialMarch)
          }}
        >
          play
        </button>
      </>
    )
  }

  ReactDOM.render(<Sequencer />, document.getElementById('root'))
}

app()
