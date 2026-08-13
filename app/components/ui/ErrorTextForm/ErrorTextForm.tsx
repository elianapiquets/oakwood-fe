type ErrorTextFormProps = {
  message: string | undefined;
};

const ErrorTextForm = ({ message }: ErrorTextFormProps) => (
  <>
    {message ? <div className={'text-red-500 text-sm'}>{message}</div> : null}
  </>
);

export { ErrorTextForm };
export type { ErrorTextFormProps };
