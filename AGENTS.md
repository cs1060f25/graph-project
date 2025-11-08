Your project team should create an AGENTS.md file specific to your project. See https://agents.md/ Links to an external site. for basic details; there are lots of examples of these files for various open source projects, and lots of documentation on how to create these files. Some of this will be discussed in class.

(5 points) Create a general AGENTS.md file that describes your project and context in detail. When coding Part 4, experiment with modifying your AGENTS.md file and seeing what happens. You do not need to document these experiments.
(5 points) In your AGENTS.md file, include a "Testing instructions" or equivalent section that describes (there's one example in https://agents.md/ Links to an external site.):
A continuous integration plan (if you have CI)
How to run your tests
How to run any linters or other static analysis tools
Instructions on when to update tests
Instructions NOT to change existing tests unless explicitly requested by the user
Other instructions you think are relevant.

# AGENTS.md

## Project description/context
- Research, especially in hot topics such as AI and biomedical sciences, has become extremely difficult to parse.  For example, Arxiv is seeing over 150 new publishings each day; from 2013-2023, there has been a doubling of AI papers, from 103,000 to 242,000 (link); and the AI Index Report says that in 2022, that approximately 41,200 AI papers were from conferences (ICML, NeurlIPS).  Because of this massive overload, it can be difficult to parse through what papers are most important for its readers, depending on the type of question they wish to ask:
    - Future Research: Which current papers show the most promise for future research for topic(s)?
    - Past Prediction: Which papers have influenced our current trajectory the most (if I am starting out new in research or want to only sift through the most important prior research to get caught up)?
    - Application: I am applying AI, what papers might be best to aid the kind of system I currently have (some papers may not provide meaningful results., and even if they do, they are not applicable or repeatable... OpenAI researchers I've talked to have called this 'garbage' )
- In sum, GRAPHENE provides a way for users to graphically search through the most impactful or projected research relative to interests and needs.


## Testing instructions
- CI is not established yet, but our group will discuss it.
- How to run tests: tests for both frontend and frontend-backend integration are located in client/graph-project-react-app/src/tests.  To run each individual test, simply navigate in your terminal to client/graph-project-react-app and ru the following command: `node src/tests/[test.js]`.  An example would be `node src/tests/test-api-handler.js`.
- Static analysis: we do not have any linters at the moment.
- Updating tests: ALWAYS look over tests when making any change to a module that is being tested.  That is, whenever you make changes to a component, run the test to see if it passes.  If the tests become outdated based on new implementation (for example, new required arguments), fix it then.  For newly-made components with no tests, add a file for that component in the  client/graph-project-react-app/src/tests.
- DO NOT change an existing test to fit your implementation if you expect something is wrong.  Only change for argument updates or versioning/depreciation concerns.