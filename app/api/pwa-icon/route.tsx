import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const size = parseInt(req.nextUrl.searchParams.get('size') ?? '192')
  const s = size <= 192 ? 192 : 512

  const iconSize = Math.round(s * 0.55)
  const subSize = Math.round(s * 0.1)
  const gap = Math.round(s * 0.03)

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          background: '#E8734A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: iconSize,
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '-4px',
            lineHeight: 1,
          }}
        >
          IM
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: subSize,
            fontWeight: 500,
            fontFamily: 'sans-serif',
            letterSpacing: '1px',
            marginTop: gap,
          }}
        >
          ImmoManage
        </span>
      </div>
    ),
    { width: s, height: s }
  )
}
