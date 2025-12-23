# 22. GraphQL

## 📚 Overview

GraphQL is a query language for APIs that provides a complete description of data, allowing clients to request exactly what they need. Developed by Facebook, it offers an alternative to REST APIs with more flexibility and efficiency.

## 🎯 Key Concepts

### GraphQL vs REST

```
GraphQL:
- Single endpoint
- Client specifies data
- No over/under-fetching
- Strongly typed
- Introspection

REST:
- Multiple endpoints
- Server defines data
- Over/under-fetching common
- Less strict typing
- Documentation separate
```

### Core Concepts

```
Schema: Type definitions
Query: Read data
Mutation: Write data
Subscription: Real-time updates
Resolver: Function that returns data
```

## 💻 Examples

### Basic GraphQL Server (Apollo Server)

```javascript
const { ApolloServer, gql } = require('apollo-server');

// Type definitions
const typeDefs = gql`
  type Book {
    id: ID!
    title: String!
    author: String!
    publishedYear: Int
  }

  type Query {
    books: [Book]
    book(id: ID!): Book
  }

  type Mutation {
    addBook(title: String!, author: String!, publishedYear: Int): Book
    deleteBook(id: ID!): Boolean
  }
`;

// Sample data
const books = [
  { id: '1', title: '1984', author: 'George Orwell', publishedYear: 1949 },
  { id: '2', title: 'Brave New World', author: 'Aldous Huxley', publishedYear: 1932 }
];

// Resolvers
const resolvers = {
  Query: {
    books: () => books,
    book: (parent, args) => books.find(book => book.id === args.id)
  },
  Mutation: {
    addBook: (parent, args) => {
      const book = {
        id: String(books.length + 1),
        ...args
      };
      books.push(book);
      return book;
    },
    deleteBook: (parent, args) => {
      const index = books.findIndex(book => book.id === args.id);
      if (index === -1) return false;
      books.splice(index, 1);
      return true;
    }
  }
};

// Create server
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
```

### Client Queries

```graphql
# Get all books
query {
  books {
    id
    title
    author
  }
}

# Get specific book
query {
  book(id: "1") {
    title
    author
    publishedYear
  }
}

# Query with variables
query GetBook($id: ID!) {
  book(id: $id) {
    title
    author
  }
}

# Multiple queries
query {
  book1: book(id: "1") {
    title
  }
  book2: book(id: "2") {
    title
  }
}

# Mutation
mutation {
  addBook(
    title: "The Great Gatsby"
    author: "F. Scott Fitzgerald"
    publishedYear: 1925
  ) {
    id
    title
  }
}
```

### Express Integration

```javascript
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schema');

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Add auth, database, etc. to context
    const token = req.headers.authorization || '';
    return { token };
  }
});

await server.start();
server.applyMiddleware({ app });

app.listen(4000, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
```

### Schema with Database

```javascript
const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');

// MongoDB Models
const User = mongoose.model('User', {
  name: String,
  email: String,
  age: Number
});

const Post = mongoose.model('Post', {
  title: String,
  content: String,
  authorId: mongoose.Schema.Types.ObjectId
});

// Type definitions
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post]
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }

  type Query {
    users: [User]
    user(id: ID!): User
    posts: [Post]
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!, age: Int): User
    createPost(title: String!, content: String!, authorId: ID!): Post
    updateUser(id: ID!, name: String, email: String, age: Int): User
    deleteUser(id: ID!): Boolean
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: () => User.find(),
    user: (_, { id }) => User.findById(id),
    posts: () => Post.find(),
    post: (_, { id }) => Post.findById(id)
  },
  
  Mutation: {
    createUser: (_, args) => User.create(args),
    createPost: (_, args) => Post.create(args),
    updateUser: (_, { id, ...updates }) => 
      User.findByIdAndUpdate(id, updates, { new: true }),
    deleteUser: async (_, { id }) => {
      await User.findByIdAndDelete(id);
      return true;
    }
  },
  
  // Nested resolvers
  User: {
    posts: (user) => Post.find({ authorId: user.id })
  },
  
  Post: {
    author: (post) => User.findById(post.authorId)
  }
};

// Connect to MongoDB
mongoose.connect('mongodb://localhost/graphql-demo');

const server = new ApolloServer({ typeDefs, resolvers });
server.listen().then(({ url }) => console.log(`Server ready at ${url}`));
```

### Authentication

```javascript
const jwt = require('jsonwebtoken');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
  }
`;

const resolvers = {
  Query: {
    me: (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return User.findById(user.id);
    }
  },
  
  Mutation: {
    signup: async (_, { username, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        email,
        password: hashedPassword
      });
      
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      
      return { token, user };
    },
    
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('User not found');
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid password');
      
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      
      return { token, user };
    }
  }
};

// Context with authentication
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { user: decoded };
      } catch (error) {
        console.error('Invalid token');
      }
    }
    
    return {};
  }
});
```

### Pagination

```javascript
const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String!
  }

  type PostConnection {
    edges: [PostEdge]
    pageInfo: PageInfo!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type Query {
    posts(first: Int, after: String, last: Int, before: String): PostConnection
  }
`;

const resolvers = {
  Query: {
    posts: async (_, { first = 10, after, last, before }) => {
      const query = {};
      
      if (after) {
        query._id = { $gt: after };
      } else if (before) {
        query._id = { $lt: before };
      }
      
      const limit = first || last;
      const posts = await Post.find(query)
        .limit(limit + 1)
        .sort({ _id: 1 });
      
      const hasNextPage = posts.length > limit;
      const edges = posts.slice(0, limit).map(post => ({
        node: post,
        cursor: post._id.toString()
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor
        }
      };
    }
  }
};
```

### Subscriptions (Real-time)

```javascript
const { ApolloServer, gql, PubSub } = require('apollo-server');

const pubsub = new PubSub();

const typeDefs = gql`
  type Message {
    id: ID!
    text: String!
    user: String!
  }

  type Query {
    messages: [Message]
  }

  type Mutation {
    sendMessage(text: String!, user: String!): Message
  }

  type Subscription {
    messageSent: Message
  }
`;

const resolvers = {
  Query: {
    messages: () => messages
  },
  
  Mutation: {
    sendMessage: (_, { text, user }) => {
      const message = {
        id: String(messages.length + 1),
        text,
        user
      };
      messages.push(message);
      
      // Publish event
      pubsub.publish('MESSAGE_SENT', { messageSent: message });
      
      return message;
    }
  },
  
  Subscription: {
    messageSent: {
      subscribe: () => pubsub.asyncIterator(['MESSAGE_SENT'])
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

// Client subscription
const subscription = gql`
  subscription {
    messageSent {
      id
      text
      user
    }
  }
`;
```

### DataLoader (Batching & Caching)

```javascript
const DataLoader = require('dataloader');

// Batch load users
const userLoader = new DataLoader(async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } });
  
  // Return in same order as input
  return userIds.map(id => 
    users.find(user => user._id.toString() === id)
  );
});

const resolvers = {
  Post: {
    author: (post, _, { loaders }) => {
      // Uses DataLoader - batches & caches
      return loaders.user.load(post.authorId);
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    loaders: {
      user: userLoader
    }
  })
});
```

### Error Handling

```javascript
const { ApolloError, UserInputError, AuthenticationError } = require('apollo-server');

const resolvers = {
  Query: {
    user: async (_, { id }) => {
      const user = await User.findById(id);
      
      if (!user) {
        throw new UserInputError('User not found', {
          invalidArgs: ['id']
        });
      }
      
      return user;
    }
  },
  
  Mutation: {
    createPost: (_, args, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      try {
        return Post.create({ ...args, authorId: user.id });
      } catch (error) {
        throw new ApolloError('Failed to create post', 'CREATE_POST_ERROR', {
          details: error.message
        });
      }
    }
  }
};

// Format errors
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    console.error(error);
    
    return {
      message: error.message,
      code: error.extensions?.code,
      locations: error.locations,
      path: error.path
    };
  }
});
```

### Directives

```javascript
const { SchemaDirectiveVisitor } = require('apollo-server');
const { defaultFieldResolver } = require('graphql');

// Custom directive
class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    const { role } = this.args;
    
    field.resolve = async function (...args) {
      const context = args[2];
      
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      if (role && context.user.role !== role) {
        throw new ForbiddenError('Insufficient permissions');
      }
      
      return resolve.apply(this, args);
    };
  }
}

const typeDefs = gql`
  directive @auth(role: String) on FIELD_DEFINITION

  type Query {
    publicData: String
    privateData: String @auth
    adminData: String @auth(role: "admin")
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    auth: AuthDirective
  }
});
```

### File Upload

```javascript
const { ApolloServer, gql } = require('apollo-server-express');
const { GraphQLUpload } = require('graphql-upload');
const fs = require('fs');
const path = require('path');

const typeDefs = gql`
  scalar Upload

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Mutation {
    uploadFile(file: Upload!): File!
  }
`;

const resolvers = {
  Upload: GraphQLUpload,
  
  Mutation: {
    uploadFile: async (_, { file }) => {
      const { createReadStream, filename, mimetype, encoding } = await file;
      
      const stream = createReadStream();
      const uploadPath = path.join(__dirname, 'uploads', filename);
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(fs.createWriteStream(uploadPath))
          .on('finish', resolve)
          .on('error', reject);
      });
      
      return { filename, mimetype, encoding };
    }
  }
};
```

## 🎤 Interview Questions

### Q1: What is GraphQL?
**Answer:** Query language for APIs allowing clients to request exactly the data they need. Single endpoint, strongly typed schema.

### Q2: What are the main differences between GraphQL and REST?
**Answer:**
- **GraphQL**: Single endpoint, client specifies data, no over-fetching
- **REST**: Multiple endpoints, server defines data, can over/under-fetch

### Q3: What are resolvers?
**Answer:** Functions that return data for schema fields. Connect schema to data sources (database, APIs, etc.).

### Q4: What is a GraphQL schema?
**Answer:** Type definitions describing available data and operations (queries, mutations, subscriptions).

### Q5: What are mutations?
**Answer:** Operations that modify data (create, update, delete). Similar to POST/PUT/DELETE in REST.

### Q6: What are subscriptions?
**Answer:** Real-time updates using WebSocket. Clients subscribe to events and receive updates when data changes.

### Q7: What is DataLoader?
**Answer:** Batching and caching utility to prevent N+1 query problem. Batches multiple requests into single query.

### Q8: How does authentication work in GraphQL?
**Answer:** Add user to context from JWT token. Check authentication in resolvers or use directives.

### Q9: What is introspection?
**Answer:** GraphQL feature allowing clients to query schema itself. Enables auto-generated documentation and tooling.

### Q10: What are fragments?
**Answer:** Reusable units in queries. Define set of fields once, reuse in multiple queries.

## 🎯 Best Practices

1. **Use DataLoader to prevent N+1 queries**
   ```javascript
   const loader = new DataLoader(batchFn);
   ```

2. **Implement proper authentication**
   ```javascript
   context: ({ req }) => ({ user: getUser(req) })
   ```

3. **Add pagination for lists**
   ```javascript
   posts(first: 10, after: "cursor")
   ```

4. **Handle errors properly**
   ```javascript
   throw new UserInputError('Invalid input');
   ```

5. **Use subscriptions for real-time**
   ```javascript
   pubsub.publish('EVENT', data);
   ```

## 📚 Additional Resources

- [GraphQL Official](https://graphql.org/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

---

[← Previous: WebSockets](./21-websockets.md) | [Next: Microservices →](./23-microservices.md)
