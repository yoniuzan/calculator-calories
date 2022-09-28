import { CalculatorCaloriesService } from './../../../services/calculator-calories.service';
import { Component, OnInit } from '@angular/core';
import { Ingredients } from 'src/app/models/Ingredients';

@Component({
    selector: 'add-product',
    templateUrl: './add-product.component.html',
    styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit {

    public showFormProduct: boolean = false;
    public newItem: Ingredients = new Ingredients();
    public errors: Array<string> = [];
    public quantity: number;

    constructor(private _calculatorService: CalculatorCaloriesService) {
        this.initItem();
    }

    private initItem(): void {
        this.newItem = new Ingredients();
        this.quantity = null;
        this.newItem.Carbohydrates = null;
        this.newItem.Dessert = null;
        this.newItem.DietaryFiber = null;
        this.newItem.Fats = null;
        this.newItem.Proteins = null;
        this.newItem.SaturatedFattyAcids = null;
    }

    ngOnInit(): void {
    }

    private validationForm(): boolean {
        const errors: Array<string> = [];

        if (this.newItem.Name.length == 0) {
            errors.push('שם מוצר לא תקין')
        }

        this.errors = errors;

        if (this.errors.length > 0)
            return false;


        return true;
    }

    public addItem(): void {
        if (!this.validationForm()) {
            alert(this.errors);
            return;
        }

        this.quantity = this.quantity ?? 100;
        this.newItem.Carbohydrates = this.newItem.Carbohydrates ?? 0;
        this.newItem.Dessert = this.newItem.Dessert ? this.newItem.Dessert / 4 : 0;
        this.newItem.DietaryFiber = this.newItem.DietaryFiber ?? 0;
        this.newItem.Fats = this.newItem.Fats ?? 0;
        this.newItem.Proteins = this.newItem.Proteins ?? 0;

        this._calculatorService.onAddManualyItem(this.quantity, this.newItem);
        this.initItem();

    }


}
