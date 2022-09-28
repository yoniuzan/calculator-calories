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

    public _isEmptyResult: boolean = false;
    public _data$: Observable<FoodItem[]>;
    public isProccessing: boolean = false;

    private _subscriptions: Array<Subscription>;

    constructor(private _calculatorService: CalculatorCaloriesService) { 
        this._data$ = of([]);
        this.registerEvents();
    }

    private registerEvents(): void {
        const subscriptions: Array<Subscription> = [];

        subscriptions.push(this._calculatorService.registerOnsearch().subscribe((res: Array<FoodItem>) => {
            this._isEmptyResult = !res || res.length == 0
        }));

        subscriptions.push(this._calculatorService.registerOnRemoveProduct().subscribe((productId: string) => {
            this._data$.forEach(el => el.forEach(x => {
                if(x.Id == productId)
                    x.IsAdded = false
            }));
        }));

        subscriptions.push(this._calculatorService.registerOnClearTable().subscribe(() => {
            this._data$.forEach(el => el.forEach(x => x.IsAdded = false));
        }));

        this._subscriptions = subscriptions;
    }

    ngOnInit(): void {
    }

    onKey(event: any): Promise<void> {
        if (event.target.value.length == 0)
            return;

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

    private clearSubscriptions(): void {
        this._subscriptions.forEach((sub) => sub.unsubscribe());
        this._subscriptions = [];
    }

    ngOnDestroy(): void {
        this.clearSubscriptions();
    }

}
