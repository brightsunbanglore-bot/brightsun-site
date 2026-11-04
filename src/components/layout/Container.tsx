type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function Container({ children, className = "", ...rest }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-14 ${className}`} {...rest}>
      {children}
    </div>
  );
}
