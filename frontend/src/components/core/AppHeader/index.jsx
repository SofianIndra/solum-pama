import Image from "next/image";
import HeaderTabs from "./HeaderTabs";

const AppHeader = () => {
  return (
    <header className="border-b-4 border-accent bg-nav">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-5 px-4 sm:px-6">
        <Image
          src="/acs-logo.png"
          alt="ACS Group — PT Autojaya Idetech, PT Solusi Periferal"
          width={800}
          height={166}
          priority
          className="h-10 w-auto sm:h-12"
        />
        <div className="hidden h-10 w-px bg-white/15 md:block" />
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-semibold text-white">SOLUM ESL</p>
          <p className="text-xs text-white/60">Stock &amp; LED Portal</p>
        </div>
        <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/80 lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Stok → AIMS LED
        </span>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <HeaderTabs />
      </div>
    </header>
  );
};

export default AppHeader;
