import Header from "./components/Header";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Upload from "./components/Upload";
import Checklist from "./components/Checklist";
import Validator from "./components/Validator";
import Steps from "./components/Steps";
import EnvSpec from "./components/EnvSpec";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen bg-bg text-ink">
      {/* ambient layers */}
      <div aria-hidden="true" className="bg-blueprint pointer-events-none fixed inset-0 z-0" />
      <div aria-hidden="true" className="glow-teal pointer-events-none fixed -left-[15%] -top-[10%] z-0 h-[55vw] w-[55vw] max-h-[720px] max-w-[720px] rounded-full" />
      <div aria-hidden="true" className="glow-amber pointer-events-none fixed -bottom-[20%] -right-[12%] z-0 h-[50vw] w-[50vw] max-h-[680px] max-w-[680px] rounded-full" />
      <div aria-hidden="true" className="bg-noise pointer-events-none fixed inset-0 z-[70]" />

      <Header />

      <main className="relative z-10">
        <Hero />
        <Ticker />
        <Upload />
        <Checklist />
        <Validator />
        <Steps />
        <EnvSpec />
        <FAQ />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
