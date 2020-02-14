import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';
import { Store } from '@ngrx/store';
import '../../../../node_modules/zone.js/dist/zone.js';

import { NewsItemComponent } from './news-item/news-item.component';
import { NewsService } from '../../services/news.service';
import { News } from '../../model/news';
import { NewsActions } from '../../store/actions/news.actions';
import { getNews } from '../../store/reducers/selector';
import { news } from '../../store/reducers/news.reducer';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
  providers: []
})
export class NewsComponent implements OnInit {
  sectionNewsList: any;
  obs: Observable<any>;

  constructor(private newsService: NewsService, private activatedRoute: ActivatedRoute, private store: Store<any>, private actions: NewsActions
  ) { }

  ngOnInit() {
    let sectionName;
    this.activatedRoute.params.subscribe(data => { sectionName = data.id; });
    // send this sectionName to newsService. Subscribe newsService and get the newsList
    // now, get news from store
    this.obs = this.newsService.getSectionNews(sectionName);
    this.obs.subscribe(data => {
      this.store.dispatch(this.actions.LoadSectionNews(data.results));
      this.store.select(state => state.news).subscribe(data => this.sectionNewsList = data.newsList);
    });
  }
}
