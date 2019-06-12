import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import WebAudioScheduler from 'web-audio-scheduler'
import './index.css'

let samples = ['dan', 'dun', 'den', 'dee-dan']

function createBuffers({ audioCtx, samples }) {
  return Promise.all(
    samples.map(async sample => {
      let response = await fetch(`./${sample}.wav`)
      let arrayBuffer = await response.arrayBuffer()
      let buffer = await audioCtx.decodeAudioData(arrayBuffer)
      return buffer
    }),
  )
}

async function app() {
  let response = await fetch('./hello_world.wav')
  let arrayBuffer = await response.arrayBuffer()

  let audioCtx = new AudioContext()
  let buffer = await audioCtx.decodeAudioData(arrayBuffer)

  let buffers = await createBuffers({ samples, audioCtx })

  let play = buffer => event => {
    let source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)
    source.start(event.playbackTime)
  }

  // document.body.onclick = () =>
  // play(buffer)({ playbackTime: audioCtx.currentTime })

  window.onkeypress = e =>
    play(buffers[e.keyCode % samples.length])({
      playbackTime: audioCtx.currentTime,
    })

  const sched = new WebAudioScheduler({ context: audioCtx })

  let Button = ({ on, onClick }) => (
    <button
      onClick={onClick}
      style={{ backgroundColor: on ? 'blue' : 'black', width: 50, height: 50 }}
    />
  )

  let Thing = () => {
    let [sequence, setSequence] = useState(
      Array(samples.length)
        .fill()
        .map(() =>
          Array(8)
            .fill()
            .map(() => false),
        ),
    )

    function imperialMarch(event) {
      let t = event.playbackTime

      let beat = 60 / 120

      // sched.insert(t, play(buffers[0]))
      // sched.insert(t + beat, play(buffers[0]))
      // sched.insert(t + beat * 2, play(buffers[1]))
      // sched.insert(t + beat * 3, play(buffers[3]))
      // sched.insert(t + beat * 4, play(buffers[2]))
      // sched.insert(t + beat * 5, play(buffers[3]))

      sequence.forEach((s, y) => {
        sequence[y].forEach((active, x) => {
          if (active) sched.insert(t + beat * x, play(buffers[y]))
        })
      })
    }

    return (
      <>
        {samples.map((s, y) => (
          <div key={y}>
            {Array(8)
              .fill()
              .map((_, x) => (
                <Button
                  key={x}
                  on={sequence[y][x]}
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
            sched.start(imperialMarch)
          }}
        >
          play
        </button>
      </>
    )
  }

  ReactDOM.render(<Thing on />, document.getElementById('root'))
}

app()
