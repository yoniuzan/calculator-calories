export class Ingredients {
    public Id: string;
    public Name: string;
    public Calories: number;
    public Fats: number;
    public Carbohydrates: number;
    public Proteins: number;
    public DietaryFiber: number;
    public SaturatedFattyAcids: number;
    public Dessert: number;

    public constructor() {
        this.Id = "";
        this.Name = "";
        this.Fats = 0;
        this.Carbohydrates = 0;
        this.Proteins = 0;
        this.DietaryFiber = 0;
        this.SaturatedFattyAcids = 0;
        this.Dessert = 0;
    }

    public fromServer(other: any): void {

        other.forEach(element => {
            switch (element.code) {
                case "79001":
                    this.Calories = Number(element.fields[0].value);
                    break;
                case "79007":
                    this.Fats = Number(element.fields[0].value);
                    break;
                case "79003":
                    this.Carbohydrates = Number(element.fields[0].value);
                    break;
                case "79002":
                    this.Proteins = Number(element.fields[0].value);
                    break;
                case "79006":
                    this.DietaryFiber = Number(element.fields[0].value);
                    break;
                case "79008":
                    this.SaturatedFattyAcids = Number(element.fields[0].value);
                    break;
                case "79004":
                    this.Dessert = Number(element.fields[0].value);
                    break;
                default:
                    break;
            }
        });
    }
}