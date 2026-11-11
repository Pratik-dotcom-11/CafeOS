import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CafeProvider } from './context/CafeContext';
import { CustomerProvider } from './context/CustomerContext';
import { ToastContainer } from './components/shared/ToastContainer';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { CustomerProtectedRoute } from './components/shared/CustomerProtectedRoute';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerPortalLayout } from './layouts/CustomerPortalLayout';
import { KitchenLayout } from './layouts/KitchenLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';

// Public & Landing
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPolicyPage, TermsOfServicePage, AboutPage } from './pages/public/LegalInfoPages';

// Auth & Onboarding (Restaurant Staff / Admin)
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';

// Admin Pages
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { PosPage } from './pages/dashboard/PosPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';
import { MenuPage } from './pages/dashboard/MenuPage';
import { QrCodePage } from './pages/dashboard/QrCodePage';
import { TablesPage } from './pages/dashboard/TablesPage';
import { InventoryPage } from './pages/dashboard/InventoryPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { BillingPage } from './pages/dashboard/BillingPage';
import { EmployeesPage } from './pages/dashboard/EmployeesPage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

// Customer Portal Pages
import { CustomerHubPage } from './pages/customer/CustomerHubPage';
import { RestaurantDirectoryPage } from './pages/customer/RestaurantDirectoryPage';
import { RestaurantDetailPage } from './pages/customer/RestaurantDetailPage';
import { CustomerLoginPage, CustomerRegisterPage } from './pages/customer/CustomerAuthPages';
import { CustomerAuthCallbackPage } from './pages/customer/CustomerAuthCallbackPage';
import { CustomerOnboardingPage } from './pages/customer/CustomerOnboardingPage';
import { CustomerOrdersPage } from './pages/customer/CustomerOrdersPage';
import { CustomerFavoritesPage } from './pages/customer/CustomerFavoritesPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { CustomerRewardsPage } from './pages/customer/CustomerRewardsPage';
import { CustomerSupportPage } from './pages/customer/CustomerSupportPage';
import { CustomerNotificationsPage } from './pages/customer/CustomerNotificationsPage';
import { CustomerMenuPage } from './pages/customer/CustomerMenuPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';

// Kitchen Display System
import { KitchenPage } from './pages/kitchen/KitchenPage';

// Super Admin
import {
  SuperAdminCockpitPage,
  SuperAdminSubscriptionsPage,
  SuperAdminSupportPage,
  SuperAdminUsersPage,
  SuperAdminSettingsPage,
} from './pages/super-admin/SuperAdminPages';

export function App() {
  return (
    <AuthProvider>
      <CafeProvider>
        <CustomerProvider>
          <BrowserRouter>
            <Routes>
              {/* 1. Public Showcase Landing & Information Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/about" element={<AboutPage />} />

              {/* 2. Restaurant Staff / Admin Authentication & Onboarding */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<CustomerAuthCallbackPage />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requireWorkspace={false}>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />

              {/* 3. Restaurant Admin Dashboard Experience (Protected) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<OverviewPage />} />
                <Route path="pos" element={<PosPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="qr-code" element={<QrCodePage />} />
                <Route path="tables" element={<TablesPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route
                  path="billing"
                  element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <BillingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="employees"
                  element={
                    <ProtectedRoute allowedRoles={['owner', 'manager']}>
                      <EmployeesPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="customers" element={<CustomersPage />} />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute allowedRoles={['owner', 'manager']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* 4. Customer Multi-Restaurant Experience Portal */}
              <Route path="/customer" element={<CustomerPortalLayout />}>
                <Route index element={<CustomerHubPage />} />
                <Route path="login" element={<CustomerLoginPage />} />
                <Route path="register" element={<CustomerRegisterPage />} />
                <Route path="auth/callback" element={<CustomerAuthCallbackPage />} />
                <Route path="onboarding" element={<CustomerOnboardingPage />} />
                <Route path="restaurants" element={<RestaurantDirectoryPage />} />
                <Route path="restaurants/:restaurantId" element={<RestaurantDetailPage />} />
                <Route path="menu/:restaurantId" element={<CustomerMenuPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route
                  path="checkout"
                  element={
                    <CustomerProtectedRoute>
                      <CheckoutPage />
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerOrdersPage />
                    </CustomerProtectedRoute>
                  }
                />
                <Route path="orders/:orderId" element={<OrderTrackingPage />} />
                <Route
                  path="favorites"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerFavoritesPage />
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerProfilePage />
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="rewards"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerRewardsPage />
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerNotificationsPage />
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="support"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerSupportPage />
                    </CustomerProtectedRoute>
                  }
                />
              </Route>

              {/* 5. Direct In-Cafe Table QR Menu (Preserved for existing table QR stickers) */}
              <Route element={<CustomerLayout />}>
                <Route path="/menu/:restaurantSlug" element={<CustomerMenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order/:orderId" element={<OrderTrackingPage />} />
              </Route>

              {/* 6. Kitchen Display System (KDS - Protected) */}
              <Route
                path="/kitchen"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier', 'kitchen', 'waiter']}>
                    <KitchenLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<KitchenPage />} />
              </Route>

              {/* 7. SaaS Super Admin Console */}
              <Route path="/super-admin" element={<SuperAdminLayout />}>
                <Route index element={<SuperAdminCockpitPage />} />
                <Route path="restaurants" element={<SuperAdminCockpitPage />} />
                <Route path="subscriptions" element={<SuperAdminSubscriptionsPage />} />
                <Route path="support" element={<SuperAdminSupportPage />} />
                <Route path="revenue" element={<SuperAdminCockpitPage />} />
                <Route path="users" element={<SuperAdminUsersPage />} />
                <Route path="settings" element={<SuperAdminSettingsPage />} />
              </Route>

              {/* 8. Fallback Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ToastContainer />
          </BrowserRouter>
        </CustomerProvider>
      </CafeProvider>
    </AuthProvider>
  );
}

export default App;
