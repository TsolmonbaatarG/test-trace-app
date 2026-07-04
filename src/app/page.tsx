export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>QPay NextJS OTel Demo</h1>
      <p>OTel trace илгээж байна ✓</p>
      <p>Time: {new Date().toISOString()}</p>
    </main>
  );
}
