import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ImagingComponent} from './components/imaging/imaging.component';
import {ImagingResolver} from './services/imaging-resolver.service';
import {ErrorComponent} from './components/error/error.component';

const routes: Routes = [
  {
    path: 'error',
    component: ErrorComponent
  },
  {
    path: '**',
    component: ImagingComponent
    
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}
