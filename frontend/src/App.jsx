import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { getAccessToken } from "@/lib/auth";
import { logout } from "@/store/authSlice";
import { LoginPage } from "@/pages/LoginPage";
import { AppShell } from "@/components/layout/AppShell";
function App() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const hasToken = Boolean(getAccessToken());
  if (!isAuthenticated || !hasToken) {
    if (isAuthenticated && !hasToken) {
      dispatch(logout());
    }
    return <LoginPage />;
  }
  return <AppShell onLogout={() => dispatch(logout())} />;
}
export {
  App as default
};
