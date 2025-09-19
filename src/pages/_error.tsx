// pages/_error.tsx
import NextErrorComponent, { type ErrorProps } from "next/error";
import * as Sentry from "@sentry/nextjs";
import type { NextPageContext } from "next";

type MyErrorProps = ErrorProps & {
  hasGetInitialPropsRun?: boolean;
  err?: Error;
};

function MyError({ statusCode, hasGetInitialPropsRun, err }: MyErrorProps) {
  // Si une erreur est présente mais que getInitialProps n'a pas tourné
  // (ex: erreur côté client en navigation), on la capture ici.
  if (!hasGetInitialPropsRun && err) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    Sentry.captureUnderscoreErrorException(err);
  }

  // Rendu de la page d'erreur Next.js par défaut
  return <NextErrorComponent statusCode={statusCode} />;
}

MyError.getInitialProps = async (context: NextPageContext) => {
  const errorInitialProps: MyErrorProps =
    await NextErrorComponent.getInitialProps(context);

  const { res, err, asPath } = context;

  // Workaround Next.js: ne pas reporter les 404 classiques
  if (res?.statusCode === 404) {
    return errorInitialProps;
  }

  // Si on a déjà l'erreur, on la capture ici
  if (err) {
    Sentry.captureUnderscoreErrorException(err);
    return { ...errorInitialProps, hasGetInitialPropsRun: true };
  }

  // Si on arrive ici, c'est qu'on a une erreur sans `err` fourni par Next
  // => on crée une erreur synthétique pour garder de la visibilité.
  Sentry.captureException(
    new Error(`_error.tsx getInitialProps missing data at path: ${asPath}`),
  );
  await Sentry.flush(2000);

  return { ...errorInitialProps, hasGetInitialPropsRun: true };
};

export default MyError;
