const INPUT_BASE_CLASSNAMES = `!text-primary !bg-secondary-10 !text-BodyRegularLg [&>input]:!bg-transparent !px-4 !h-[56px] !py-2
!border-[0.75px] !border-secondary-10 hover:!border-primary !rounded-xl !disabled:bg-subtle
focus:!border-primary focus:!ring-0 focus:!ring-offset-0 focus:!outline-none
focus-visible:!border-primary focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none
focus-within:!border-primary focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!outline-none`;

const INPUT_ANTD_SUFFIX_CLASSNAMES =
  '[&_.ant-input-suffix]:!absolute [&_.ant-input-suffix]:!right-4 [&_.ant-input-suffix]:!top-1/2 [&_.ant-input-suffix]:!-translate-y-1/2';

const INPUT_ANTD_PREFIX_CLASSNAMES =
  '[&_.ant-input-prefix]:text-primary/0 [&_.ant-input-prefix]:!-translate-y-1/10';

const INPUT_FOCUSED_CLASSNAMES = '!bg-white !border-primary';

const INPUT_DISABLED_CLASSNAMES = 'cursor-pointer pointer-events-none';

const INPUT_FLOATING_CLASSNAMES =
  '!pt-6 !pb-2 [&_.ant-input-prefix]:!text-primary';

const INPUT_ERROR_CLASSNAMES = '!border-error';

const TEXTAREA_BASE_CLASSNAMES = `!text-primary !bg-secondary-10 !text-BodyRegularLg !px-4 !py-3
!border-[0.75px] !border-secondary-10 hover:!border-primary !rounded-xl !disabled:bg-subtle
focus:!border-primary focus:!ring-0 focus:!ring-offset-0 focus:!outline-none
focus-visible:!border-primary focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none`;

const TEXTAREA_FOCUSED_CLASSNAMES = '!bg-white !border-primary';

const TEXTAREA_ERROR_CLASSNAMES = '!border-error';

export {
  INPUT_BASE_CLASSNAMES,
  INPUT_ANTD_SUFFIX_CLASSNAMES,
  INPUT_ANTD_PREFIX_CLASSNAMES,
  INPUT_FOCUSED_CLASSNAMES,
  INPUT_DISABLED_CLASSNAMES,
  INPUT_FLOATING_CLASSNAMES,
  INPUT_ERROR_CLASSNAMES,
  TEXTAREA_BASE_CLASSNAMES,
  TEXTAREA_FOCUSED_CLASSNAMES,
  TEXTAREA_ERROR_CLASSNAMES,
};
