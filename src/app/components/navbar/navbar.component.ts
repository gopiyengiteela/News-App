import { News } from './../../model/news';
import { NewsState } from './../../store/reducers/news.reducer';
import { NewsActions } from '../../store/actions/news.actions';

import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  subsections: string[];
  response: News[];
  constructor(
    private store: Store<any>,
    private newsActions: NewsActions
  ) {
    this.subsections = [];
    this.store.select(state => state.news).subscribe(data => {
      this.response = data.newsList;
      if (this.response.length > 0) {
        for (var i = 0; i < this.response.length; i++) {
          this.subsections.push(this.response[i].subsection)
        }
        this.subsections = Array.from(new Set(this.subsections));
      }
    });

  }

  ngOnInit() {

  }

  dispatchAction($event: string) {
    this.store.dispatch(this.newsActions.FilterSubsection($event))
  }

}
