"use client";

/**
 * The last resort: it replaces the whole page, so it cannot use the app's providers or language files.
 * The two languages live in this small table instead.
 */
const WORDS = {
  en: {
    title: "Something went wrong",
    text: "Stoafi hit an unexpected problem. Your data is still on this device. Reload the page, and if it keeps happening, open Settings and download a backup first.",
    reload: "Reload",
  },
  tr: {
    title: "Bir şeyler ters gitti",
    text: "Stoafi beklenmedik bir sorunla karşılaştı. Verilerin hâlâ bu cihazda. Sayfayı yeniden yükle; tekrar olursa önce Ayarlar'dan bir yedek indir.",
    reload: "Yeniden yükle",
  },
} as const;

export default function GlobalError() {
  const words = navigator.language.toLowerCase().startsWith("tr") ? WORDS.tr : WORDS.en;
  return (
    <html lang={navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en"}>
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: "2rem auto",
          maxWidth: "32rem",
          padding: "0 1rem",
        }}
      >
        <h1>{words.title}</h1>
        <p>{words.text}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {words.reload}
        </button>
      </body>
    </html>
  );
}
