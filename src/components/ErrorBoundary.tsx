import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  resetData = () => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("ip-dok")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* приватный режим */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-[#edf1f7] p-6">
        <div className="w-full max-w-md border border-[#e05555]/40 bg-white p-8 text-center shadow-[0_30px_70px_-30px_rgba(14,36,60,0.4)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-[#e05555]/50 bg-[#fbe7e5]">
            <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden="true">
              <path d="M11 1.5 21 18.5H1z" stroke="#e05555" strokeWidth="1.8" />
              <path d="M11 7.5v4.5" stroke="#e05555" strokeWidth="2" />
              <circle cx="11" cy="15" r="1.1" fill="#e05555" />
            </svg>
          </div>
          <h1 className="mt-5 font-[Unbounded,sans-serif] text-[18px] font-extrabold text-[#12243c]">Что-то пошло не так</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#5c6c84]">
            Приложение столкнулось с ошибкой при чтении данных. Обычно помогает сброс локального хранилища —
            документы из резервной копии можно вернуть импортом JSON.
          </p>
          <p className="mt-3 break-all border border-[#dce4ee] bg-[#f4f7fb] px-3 py-2 font-mono text-[10.5px] text-[#8c9bb0]">
            {this.state.error.message || "неизвестная ошибка"}
          </p>
          <div className="mt-6 flex justify-center gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="cursor-pointer border border-[#c7d3e2] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#5c6c84] hover:text-[#12243c]"
            >
              перезагрузить
            </button>
            <button
              onClick={this.resetData}
              className="cursor-pointer bg-[#e05555] px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#c74444]"
            >
              сбросить данные
            </button>
          </div>
        </div>
      </div>
    );
  }
}
