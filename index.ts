export class ReduxLoggerLink extends ApolloLink {
  public request(operation: Operation, next?: NextLink): Observable<FetchResult> | null {
    const operationType = (operation.query.definitions[0] as OperationDefinitionNode).operation;

    if (operationType === 'query') {
      store.dispatch(actions.queryStarted({
        name: operation.operationName,
        query: print(operation.query),
        variables: operation.variables
      }));
    } else if (operationType === 'mutation') {
      store.dispatch(actions.mutationStarted({
        name: operation.operationName,
        mutation: print(operation.query),
        variables: operation.variables
      }));
    }

    if (next) {
      const observer = next(operation);
      
      observer.subscribe({
        error: e => {
          if (operationType === 'query') {
            store.dispatch(actions.queryError({
              name: operation.operationName,
              error: new Error(e)
            }))
          } else if (operationType === 'mutation') {
            store.dispatch(actions.mutationError({
              name: operation.operationName,
              error: new Error(e)
            }))
          }
        },
        next: value => {
          if (operationType === 'query') {
            store.dispatch(actions.queryResultReceived({
              name: operation.operationName,
              response: value
            }));
          } else if (operationType === 'mutation') {
            store.dispatch(actions.mutationResultReceived({
              name: operation.operationName,
              response: value
            }));
          }
        }
      });

      return observer;
    } else {
      return null;
    }
  }
}
