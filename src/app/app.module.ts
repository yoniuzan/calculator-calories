import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CalculatorCaloriesComponent } from './components/calculator-calories/calculator-calories.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatInputModule} from '@angular/material/input';
import { SearchProductComponent } from './components/calculator-calories/search-product/search-product.component';
import { AddProductComponent } from './components/calculator-calories/add-product/add-product.component';
import { ProductTableComponent } from './components/calculator-calories/product-table/product-table.component';


@NgModule({
  declarations: [
    AppComponent,
    CalculatorCaloriesComponent,
    SearchProductComponent,
    AddProductComponent,
    ProductTableComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
