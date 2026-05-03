import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: '#E8734A',
            display: 'flex',
          }}
        />

        {/* Logo text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontSize: '80px',
              fontWeight: 700,
              color: '#E8734A',
              letterSpacing: '-2px',
            }}
          >
            Immo
          </span>
          <span
            style={{
              fontSize: '80px',
              fontWeight: 700,
              color: '#1A1A2E',
              letterSpacing: '-2px',
            }}
          >
            Manage
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '60px',
            height: '3px',
            background: '#E8734A',
            borderRadius: '2px',
            marginBottom: '24px',
            display: 'flex',
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#6b7280',
            fontWeight: 400,
            letterSpacing: '0.5px',
          }}
        >
          Immobilienverwaltung Schweiz
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '18px',
            color: '#9ca3af',
            fontWeight: 400,
            display: 'flex',
          }}
        >
          immo-manage.ch
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
