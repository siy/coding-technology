public sealed interface UseCase<R, T> {
    interface Plain<R, T> extends UseCase<R, T> {
        R execute(T input);
    }

    interface WithOption<R, T> extends UseCase<Option<R>, T> {
        Option<R> execute(T input);
    }

    interface WithResult<R, T> extends UseCase<Result<R>, T> {
        Result<R> execute(T input);
    }

    interface WithPromise<R, T> extends UseCase<Promise<R>, T> {
        Promise<R> execute(T input);
    }
}
