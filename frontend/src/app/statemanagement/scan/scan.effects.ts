import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of,tap} from 'rxjs';
import * as ScanActions from './scan.actions';
import { ApiService } from '../../services/api.service';
import { startScan } from './scan.actions';
import { Store } from '@ngrx/store';

@Injectable()
export class ScanEffects {
  startScan$;

  constructor(private actions$: Actions, private api: ApiService, private store: Store) {
    console.log('✅ ScanEffects constructed', { actions$: !!actions$, api: !!api });

    this.startScan$ = createEffect(() =>
      this.actions$.pipe(
        ofType(startScan),
        mergeMap(({ repoUrl }) => {
          // simulate progress updates
          const steps = [
            'Cloning repository…',
            'Analyzing dependencies…',
            'Checking vulnerabilities…',
            'Generating report…'
          ];

          steps.forEach((step, i) =>
            setTimeout(() => {
              this.store.dispatch({
                type: '[Scan] Update Progress',
                progress: (i + 1) * 25,
                currentStep: step
              });
            }, i * 1500)
          );

          return this.api.scanRepository({ url: repoUrl, scanType: 'full' }).pipe(
            tap(results => console.log('✅ Full response from backend:', results)),
            map(results => ({ type: '[Scan] Complete', results })),
            catchError(error =>
              of({ type: '[Scan] Error', error: error.message || 'Scan failed' })
            )
          );
        })
      )
    );
  }
}

