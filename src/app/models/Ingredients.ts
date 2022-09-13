export class Ingredients {
    public Id: string;
    public Name: string;
    public Calories: string;
    public Fats: string;
    public Carbohydrates: string;
    public Proteins: string;


    public fromServer(other: any): void {
        this.Id = "";
        this.Name = "";

        other.forEach(element => {
            switch (element.code) {
                case "79001":
                    this.Calories = element.fields[0].value;
                    break;
                case "79007":
                    this.Fats = element.fields[0].value;
                    break;
                case "79003":
                    this.Carbohydrates = element.fields[0].value;
                    break;
                case "79002":
                    this.Proteins = element.fields[0].value;
                    break;

                default:
                    break;
            }
        });
    }
}