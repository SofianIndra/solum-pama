import AppFooter from "@/components/core/AppFooter";
import AppHeader from "@/components/core/AppHeader";

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />
      {children}
      <AppFooter />
    </div>
  );
};

export default MainLayout;
