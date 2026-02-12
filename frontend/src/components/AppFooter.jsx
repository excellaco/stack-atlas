export default function AppFooter() {
  return (
    <footer className="app-footer">
      <span>Copyright &copy; {new Date().getFullYear()}</span>
      <a href="https://www.excella.com" target="_blank" rel="noreferrer">
        <img
          src="https://www.excella.com/wp-content/themes/excllcwpt/images/logo.svg"
          alt="Excella"
          height="14"
        />
      </a>
    </footer>
  );
}
