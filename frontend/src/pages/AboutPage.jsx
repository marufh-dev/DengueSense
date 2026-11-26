import { useLanguage } from "../context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="container">
      <h1>{t.about.title}</h1>
      <p className="subtitle">{t.about.subtitle}</p>

      <div className="two-col-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.about.v1Title}</h2>
          <p>{t.about.v1Body}</p>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.about.v2Title}</h2>
          <p>{t.about.v2Body}</p>
        </div>
      </div>
    </div>
  );
}
