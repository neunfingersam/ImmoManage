import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#E8734A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          IM
        </span>
      </div>
    ),
    { ...size }
  )
}
