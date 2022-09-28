import { CalculatorCaloriesService } from './../../../services/calculator-calories.service';
import { Component, OnDestroy } from '@angular/core';
import { Ingredients } from 'src/app/models/Ingredients';
import { FoodItem } from 'src/app/models/foodItem';
import { Subscription } from 'rxjs';

@Component({
    selector: 'product-table',
    templateUrl: './product-table.component.html',
    styleUrls: ['./product-table.component.scss']
})
export class ProductTableComponent implements OnDestroy {

    public _table: Array<Ingredients> = [];
    public CaloriesSum: number = 0;
    public FatsSum: number = 0;
    public CarbohydratesSum: number = 0;
    public ProteinsSum: number = 0;
    public DessertSum: number = 0;

    private _subscriptions: Array<Subscription>;

    constructor(private _calculatorService: CalculatorCaloriesService) { 
        this.registerEvents();
    }

    private registerEvents(): void {
        const subscriptions: Array<Subscription> = [];

        subscriptions.push(this._calculatorService.registerOnfoodTableChange().subscribe((res: Array<Ingredients>) => {
            this.CaloriesSum = 0;
            this.CarbohydratesSum = 0;
            this.FatsSum = 0;
            this.ProteinsSum = 0;
            this.DessertSum = 0;
            res.forEach(item => {
                this.CaloriesSum += item.Calories;
                this.CarbohydratesSum += item.Carbohydrates;
                this.FatsSum += item.Fats;
                this.ProteinsSum += item.Proteins;
                this.DessertSum += item.Dessert;
            })

            this._table = res;
        }));

        this._subscriptions = subscriptions;
    }

    public async onRemoveItem(item: FoodItem): Promise<void> {
        this._calculatorService.removeItem(item);

    }

    public clear(): void {
        this._calculatorService.clearTable();
        this._table = [];
    }

    private clearSubscriptions(): void {
        this._subscriptions.forEach((sub) => sub.unsubscribe());
        this._subscriptions = [];
    }

    ngOnDestroy(): void {
        this.clearSubscriptions();
    }

}
