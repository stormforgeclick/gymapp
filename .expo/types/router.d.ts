/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/routines`; params?: Router.UnknownInputParams; } | { pathname: `/../views/Home/DayRoutineComponent`; params?: Router.UnknownInputParams; } | { pathname: `/../views/Home/SugestedRoutineComponent`; params?: Router.UnknownInputParams; } | { pathname: `/../components/ui/TabBarButton`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/routines`; params?: Router.UnknownOutputParams; } | { pathname: `/../views/Home/DayRoutineComponent`; params?: Router.UnknownOutputParams; } | { pathname: `/../views/Home/SugestedRoutineComponent`; params?: Router.UnknownOutputParams; } | { pathname: `/../components/ui/TabBarButton`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/${`?${string}` | `#${string}` | ''}` | `/routines${`?${string}` | `#${string}` | ''}` | `/../views/Home/DayRoutineComponent${`?${string}` | `#${string}` | ''}` | `/../views/Home/SugestedRoutineComponent${`?${string}` | `#${string}` | ''}` | `/../components/ui/TabBarButton${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/routines`; params?: Router.UnknownInputParams; } | { pathname: `/../views/Home/DayRoutineComponent`; params?: Router.UnknownInputParams; } | { pathname: `/../views/Home/SugestedRoutineComponent`; params?: Router.UnknownInputParams; } | { pathname: `/../components/ui/TabBarButton`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
    }
  }
}
