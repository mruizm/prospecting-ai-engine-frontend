import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { from, map, catchError, of } from "rxjs";
import { ApiService } from "./api.service";

export const authGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return from(api.fetchSession()).pipe(
    map(({ authenticated }) => (authenticated ? true : router.createUrlTree(["/login"]))),
    catchError(() => of(router.createUrlTree(["/login"]))),
  );
};
