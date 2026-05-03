import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#E8734A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 78,
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '-3px',
            lineHeight: 1,
          }}
        >
          IM
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 18,
            fontWeight: 500,
            fontFamily: 'sans-serif',
            letterSpacing: '0.5px',
            marginTop: 6,
          }}
        >
          ImmoManage
        </span>
      </div>
    ),
    { ...size }
  )
}
