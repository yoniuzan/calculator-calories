import { CalculatorCaloriesService } from './../../services/calculator-calories.service';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, fromEvent, of, Observable } from 'rxjs';
import { debounceTime, mergeMap, distinctUntilChanged, toArray } from 'rxjs/operators';
import { FoodItem } from 'src/app/models/foodItem';
import { Ingredients } from 'src/app/models/Ingredients';

@Component({
    selector: 'calculator-calories',
    templateUrl: './calculator-calories.component.html',
    styleUrls: ['./calculator-calories.component.scss']
})
export class CalculatorCaloriesComponent implements OnInit, OnDestroy {

    @ViewChild("filter") filter: ElementRef;

    public _isEmpty: boolean = false;
    public _isEmptyResult: boolean = false;

    private _keySubcscription: Subscription;
    private _subscriptions: Array<Subscription>;

    public Id: string;
    public Code: string;
    public Description: string;

    public _data$: Observable<FoodItem[]>;

    public Calories: string;
    public Fats: string;
    public Carbohydrates: string;
    public Proteins: string;

    public CaloriesSum: number = 0;
    public FatsSum: number = 0;
    public CarbohydratesSum: number = 0;
    public ProteinsSum: number = 0;

    public isProccessing: boolean = false;

    public _table: Array<Ingredients> = [];

    // public isAddItem

    constructor(private _calculatorService: CalculatorCaloriesService) {
        this._data$ = of([]);
        this.registerEvents();
    }

    private registerEvents(): void {
        const subscriptions: Array<Subscription> = [];

        subscriptions.push(this._calculatorService.registerOnsearch().subscribe((res: Array<FoodItem>) => {
            this._isEmptyResult = !res || res.length == 0
        }));

        subscriptions.push(this._calculatorService.registerOnfoodTableChange().subscribe((res: Array<Ingredients>) => {
            this.CaloriesSum = 0;
            this.CarbohydratesSum = 0;
            this.FatsSum = 0;
            this.ProteinsSum = 0;
            res.forEach(item => {
                this.CaloriesSum += Number(item.Calories);
                this.CarbohydratesSum += Number(item.Carbohydrates);
                this.FatsSum += Number(item.Fats);
                this.ProteinsSum += Number(item.Proteins);
            })

            this._table = res;
        }));

        this._subscriptions = subscriptions;
    }

    ngOnInit(): void {
    }

    onKey(event: any): Promise<void> {
        if (event.target.value.length == 0) {
            return;
        }

        this._data$ = fromEvent(this.filter.nativeElement, 'keyup');
        this._data$.pipe(debounceTime(1200)).subscribe(async c => {
            if (this.isProccessing == true)
                return;

            this.isProccessing = true;
            await this._calculatorService.searchItems(event.target.value);
            this.isProccessing = false;
            this._data$ = of(this._calculatorService.FoodList).pipe(
                debounceTime(1000),
                mergeMap(x => x),
                distinctUntilChanged(),
                toArray(),
            );
        }
        );

    }

    public async onAddItem(item: FoodItem): Promise<void> {
        item.IsAdded = true;
        item.Quantity = item.Quantity == 0 ? 100 : item.Quantity;

        await this._calculatorService.getItemIngredients(item);



    }

    public async onRemoveItem(item: FoodItem): Promise<void> {
        this._data$.forEach(el => el.forEach(x => {
            if(x.Id == item.Id)
                x.IsAdded = false
        }));

        this._calculatorService.removeItem(item);

    }

    public clear(): void {
        this._data$.forEach(el => el.forEach(x => x.IsAdded = false));
        this._calculatorService.clearTable();
        this._table = [];
    }

    private clearSubscriptions(): void {
        this._subscriptions.forEach((sub) => sub.unsubscribe());
        this._subscriptions = [];
    }

    ngOnDestroy(): void {
        this._keySubcscription.unsubscribe();
        this.clearSubscriptions();
    }

}
