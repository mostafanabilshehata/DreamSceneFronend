import { Routes } from '@angular/router';
import { PartnersComponent } from './partners/partners.component';
import { HomeComponent } from './home/home.component';
import { CategoriesComponent } from './categories/categories.component';
import { DecorGalleryComponent } from './decor-gallery/decor-gallery.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProductsComponent } from './products/products.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ImageSliderComponent } from './image-slider/image-slider.component';
import { FooterComponent } from './footer/footer.component';
import { QuikViewComponent } from './quik-view/quik-view.component';
import { ImageZoomComponent } from './image-zoom/image-zoom.component';
import { SubcategoryComponent } from './subcategory/subcategory.component';
import { BasketComponent } from './basket/basket.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { UserOrdersComponent } from './user-orders/user-orders.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminHomeComponent } from './admin/admin-home/admin-home.component';
import { AdminCategoriesComponent } from './admin/admin-categories/admin-categories.component';
import { AdminProductsComponent } from './admin/admin-products/admin-products.component';
import { AdminPartnersComponent } from './admin/admin-partners/admin-partners.component';
import { AdminOrdersComponent } from './admin/admin-orders/admin-orders.component';
import { AdminSpecialOrdersComponent } from './admin/admin-special-orders/admin-special-orders.component';
import { SpecialOrderComponent } from './special-order/special-order.component';
import { adminGuard } from './guards/admin.guard';
    

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'category', component: CategoriesComponent },
    { path: 'categories/:id', component: CategoriesComponent },
    { path: 'decor', component: DecorGalleryComponent },
    { path: 'subcategory/:category', component: SubcategoryComponent },
    { path: 'subcategory/:id', component: SubcategoryComponent },
    { path: 'partners', component: PartnersComponent },
    { path: 'special-order', component: SpecialOrderComponent },
    { path: 'zoom', component: ImageZoomComponent },
    { path: 'login', component: LoginComponent },
    {path:'register' , component:RegisterComponent},
    { path: 'quik', component: QuikViewComponent },
    { path: 'home', component: HomeComponent },
    { path: 'products', component: ProductsComponent },
    { path: 'productDetails/:id', component: ProductDetailsComponent },
    { path: 'product-details/:id', component: ProductDetailsComponent },
    { path: 'aboutUs', component: AboutUsComponent },
    { path: 'contactUs', component: ContactUsComponent },
    { path: 'slider', component: ImageSliderComponent },
    { path: 'footer', component: FooterComponent },
    
    // Shopping Cart & Orders
    { path: 'basket', component: BasketComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'my-orders', component: UserOrdersComponent },
    
    // Admin Routes - Protected
    {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [adminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: AdminHomeComponent },
            { path: 'categories', component: AdminCategoriesComponent },
            { path: 'items', component: AdminProductsComponent },
            { path: 'partners', component: AdminPartnersComponent },
            { path: 'orders', component: AdminOrdersComponent },
            { path: 'special-orders', component: AdminSpecialOrdersComponent }
        ]
    },
    
    // {path:'**',component:NotFoundComponent}
];
