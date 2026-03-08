**Take home task - SDK generator**
In this project, you will be building an SDK for an existing Lord of the Rings API.

**Time requirement:** Please spend as much time as you feel is necessary to complete the task.
We ask you to submit the project code within 72 hours of starting.
First please [explore the API](https://the-one-api.dev/) and [the different endpoints](https://the-one-api.dev/documentation).

**Goal** : Write an SDK in Typescript, Python or Java that makes this API accessible to other developers. The SDK only needs to cover the **movie and quote endpoints:**
- /movie
- /movie/{id}
- /movie/{id}/quote
- /quote
- /quote/{id}

# Points to Consider

- Pay attention to code quality and readability.
- Include filtering in the SDK.
- Include a testing case suite. Keep in mind we will be looking at the solutions architecture, testing, and documentation.
- Although you're not implementing all the endpoints, write the SDK as if you were. Keep maintainability and extensibility in mind.
- Modify the readme file for your SDK users specifying how to use and test the SDK.
- The SDK does not have to mirror the API. You can add abstractions and/or combine different calls.
- The SDK should be prepared for production; However, do not share your solution anywhere online or publish the SDK.
- Include a demonstration file(s) that can be used to test the SDK locally, along with instructions on how to run it.
- Create a design.md with information about your SDK design.
- Do not use any code generation tools such as OpenAPI Generator. You can use AI tools if needed.

# Submitting Your Solution

Once you have finished writing your solution, upload it to GitHub as a public repo and share the repo with us. The repo should be called “{your name} SDK”.