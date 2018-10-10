import { ApolloLink, Observable } from 'apollo-link';
import { OperationDefinitionNode } from 'graphql';
import { print } from 'graphql/language/printer';

export const loggerLink = new ApolloLink((operation, forward) =>
  new Observable(observer => {
    let handle: ZenObservable.Subscription;
    Promise.resolve(operation)
      .then(oper => {
        const operationType = (oper.query.definitions[0] as OperationDefinitionNode).operation;

        if (operationType === 'query') {
          store.dispatch(actions.queryStarted({
            name: oper.operationName,
            query: print(oper.query),
            variables: oper.variables
          }));
        } else if (operationType === 'mutation') {
          store.dispatch(actions.mutationStarted({
            mutation: print(oper.query),
            name: oper.operationName,
            variables: oper.variables
          }));
        }

        return operationType
      })
      .then(operationType => {
        if (forward) {
          handle = forward(operation).subscribe({
            complete: observer.complete.bind(observer),
            error: err => {
              if (operationType === 'query') {
                  store.dispatch(actions.queryError({
                    error: new Error(err),
                    name: operation.operationName,
                  }))
                } else if (operationType === 'mutation') {
                  store.dispatch(actions.mutationError({
                    error: new Error(err),
                    name: operation.operationName
                  }))
                }

              return observer.error.bind(observer)(err);
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

              return observer.next.bind(observer)(value);
            }
          });
        }
      })
      .catch(observer.error.bind(observer));

    return () => {
      if (handle) {
        handle.unsubscribe();
      }
    };
  })
);
