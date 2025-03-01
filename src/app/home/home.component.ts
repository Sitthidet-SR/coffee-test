import { Component } from '@angular/core';
import { HeroComponent } from "../hero/hero.component";
import { ProductComponent } from "../product/product.component";
import { TranslateModule } from '@ngx-translate/core';
import { FooterComponent } from "../footer/footer.component";

@Component({
  selector: 'app-home',
  imports: [HeroComponent, ProductComponent, TranslateModule, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
