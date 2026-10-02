import { ImageResponse } from "next/og";

export const alt = "NOVA: objects for the quiet hours";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#eff1ee", padding: 80, color: "#1b2130" }}>
        <div style={{ display: "flex", alignItems: "flex-start", fontSize: 72, fontWeight: 800, letterSpacing: -3 }}>
          NOVA
          <svg width="30" height="30" viewBox="0 0 24 24" style={{ marginLeft: 6, marginTop: 4 }}>
            <path d="M12 0C12.7 7.3 16.7 11.3 24 12C16.7 12.7 12.7 16.7 12 24C11.3 16.7 7.3 12.7 0 12C7.3 11.3 11.3 7.3 12 0Z" fill="#4a2fe0" />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>Objects for the quiet hours.</div>
      </div>
    ),
    size,
  );
}
