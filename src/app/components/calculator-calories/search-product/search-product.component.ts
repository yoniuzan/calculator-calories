import { FoodItemMongoDb } from './../../../models/foodItemMongoDb';
import { CalculatorCaloriesService } from './../../../services/calculator-calories.service';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, fromEvent, of, Subscription } from 'rxjs';
import { debounceTime, mergeMap, distinctUntilChanged, toArray } from 'rxjs/operators';
import { FoodItem } from 'src/app/models/foodItem';

@Component({
    selector: 'search-product',
    templateUrl: './search-product.component.html',
    styleUrls: ['./search-product.component.scss']
})
export class SearchProductComponent implements OnInit, OnDestroy {

    @ViewChild("filter") filter: ElementRef;

    public _isEmptyResult: boolean = true;
    public _isEmptySearch: boolean = false;
    public _data$: Observable<FoodItem[]>;
    public isProccessing: boolean = false;
    public isLoadMore: boolean = false;
    public isEmptyMoreResult: boolean = false;

    private _inputText: string;

    private _subscriptions: Array<Subscription>;

    constructor(private _calculatorService: CalculatorCaloriesService) {
        this._data$ = of([]);
        this.registerEvents();
    }

    private registerEvents(): void {
        const subscriptions: Array<Subscription> = [];

        subscriptions.push(this._calculatorService.registerOnsearch().subscribe((res: Array<FoodItem>) => {
            this._isEmptyResult = !res || res.length == 0;
            this._isEmptySearch = !res || res.length == 0;
            this.isProccessing = false;
            this.isLoadMore = false;
            this.isEmptyMoreResult = this._calculatorService.IsEmptyResult;

            this._data$ = of(this._calculatorService.FoodList).pipe(
                debounceTime(1000),
                mergeMap(x => x),
                distinctUntilChanged(),
                toArray(),
            );

        }));

        subscriptions.push(this._calculatorService.registerOnRemoveProduct().subscribe((productId: string) => {
            this._data$.forEach(el => el.forEach(x => {
                if (x.Id == productId)
                    x.IsAdded = false
            }));
        }));

        subscriptions.push(this._calculatorService.registerOnClearTable().subscribe(() => {
            this._data$.forEach(el => el.forEach(x => x.IsAdded = false));
        }));

        subscriptions.push(this._calculatorService.registerOnEmptySearch().subscribe(() => {
            this.isProccessing = false;
        }));

        subscriptions.push(this._calculatorService.registerOnNoResult().subscribe(() => {
            this._isEmptySearch = true;
            this.isProccessing = false;
        }));

        this._subscriptions = subscriptions;
    }

    ngOnInit(): void {
    }

    onKey(event: any): Promise<void> {
        if (event.target.value.length == 0) {
            this._isEmptyResult = true;
            return;
        }

        this._inputText = event.target.value;
        this._isEmptyResult = true;

        this._data$ = fromEvent(this.filter.nativeElement, 'keyup');
        this._data$.pipe(debounceTime(1000)).subscribe((val) => {
            if (this.isProccessing)
                return;

            this.isProccessing = true;
            this._calculatorService.IsLoadMore = false;

            this._calculatorService.productStart(event.target.value);
        });
    }

    public async onAddItem(item: FoodItem | FoodItemMongoDb): Promise<void> {
        item.IsAdded = true;
        item.Quantity = item.Quantity == 0 ? 100 : item.Quantity;

        if (item instanceof FoodItemMongoDb) {
            let mongoItem = item as FoodItemMongoDb;
            if (mongoItem.Fats) {
                this._calculatorService.addItemFromMongo(mongoItem);
                return;
            }
        }


        await this._calculatorService.getItemIngredients(item);
    }

    public loadMore(): void {
        this.isLoadMore = true;
        this._calculatorService.IsLoadMore = true;
        this._calculatorService.getMoreItems();
        this._calculatorService.productStart(this._inputText);
    }

    onBlur(): void {
        this._isEmptyResult = true;
    }

    private clearSubscriptions(): void {
        this._subscriptions.forEach((sub) => sub.unsubscribe());
        this._subscriptions = [];
    }

    ngOnDestroy(): void {
        this.clearSubscriptions();
    }

}
