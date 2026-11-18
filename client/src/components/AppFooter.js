export default function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer no-print">
      <p>
        School Fee Management · {year} · Built for reliable fee collection &amp; reporting
      </p>
    </footer>
  );
}