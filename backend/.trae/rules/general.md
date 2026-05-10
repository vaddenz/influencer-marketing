# 后端项目开发通用规则 (Project Development Rules)

本文档总结了本项目的编码风格、配置管理、错误处理和日志规范，旨在指导 LLM 工具及开发者遵循统一标准。

## 1. 编码风格 (Coding Style)

- **技术栈**: TypeScript + NestJS + Prisma。
- **文件命名**: 使用 kebab-case（例如 `user.service.ts`, `file-metadata.dto.ts`）。
- **类与接口**: 使用 PascalCase（例如 `UserService`, `FileMetadataDto`）。
- **变量与函数**: 使用 camelCase（例如 `createUser`, `contentType`）。
- **导入路径**:
  - **必须** 使用路径别名 `@/` 引用 `src` 下的模块（例如 `import { UserService } from '@/user/user.service'`）。
  - 严格避免使用相对路径 `../../`，除非是同一模块内的紧密引用。
- **代码结构**:
  - 遵循 NestJS 标准模块化结构：`Module` -> `Controller` -> `Service`。
  - DTO (Data Transfer Objects) 用于所有输入/输出验证，放在对应 module 的 `dto/` 目录下。
  - 使用 `class-validator` 和 `class-transformer` 进行 DTO 验证。
- **依赖注入**: 使用构造函数注入，并标记为 `private readonly`。

## 2. 项目配置 (Project Configuration)

- **配置管理**: 使用 `@nestjs/config` 模块。
- **配置文件**: 所有配置定义在 `src/common/config/` 目录下。
- **加载方式**: 使用 `registerAs` 创建命名空间配置（例如 `registerAs('app', ...)`）。
- **环境变量**: 在配置工厂函数中读取 `process.env`，并进行简单的类型转换或提供默认值。
- **统一导出**: 在 `src/common/config/index.ts` 中导出所有配置，并添加到 `configurations` 数组中以便在 `AppModule` 中加载。

## 3. 代码复用 (Code Reuse)

- **通用模块**: 所有共享逻辑（Auth, Config, Utils, Filters 等）**必须** 放在 `src/common/` 目录下，加载 `src/common/README.md` 查看通用模块的详细说明。
- **工具类**: 通用工具函数放在 `src/common/utils/`，并通过 `index.ts` 导出，加载 `src/common/utils/README.md` 查看通用工具类的详细说明。
  - 例如：错误处理工具使用 `ErrorUtil`。
- **切面编程**:
  - 使用 **Interceptors** 处理响应转换（例如 `TransformInterceptor`）。
  - 使用 **Filters** 处理全局异常（例如 `AllExceptionsFilter`）。
  - 使用 **Guards** 处理认证与授权。
  - 使用 **Decorators** 简化元数据获取（例如 `@CurrentUser`）。

## 4. 错误处理 (Error Handling)

- **全局捕获**: 系统已配置 `AllExceptionsFilter`，自动捕获所有异常。
- **抛出异常**:
  - 业务逻辑中直接抛出 NestJS 内置的 `HttpException`（例如 `NotFoundException`, `UnauthorizedException`, `BadRequestException`）。
  - **不要** 手动构建错误响应对象，直接 throw 异常即可。
- **Prisma 错误**: `AllExceptionsFilter` 会自动将 Prisma 的错误码（如 P2002, P2025）转换为对应的 HTTP 状态码和友好消息。
- **响应格式**: 错误响应会被自动格式化为：
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "ERROR_CODE",
      "message": "Error description"
    },
    "requestId": "...",
    "time": "..."
  }
  ```

## 5. 日志处理 (Logging)

- **Logger 实例**: 使用 NestJS 自带的 `Logger` 服务或 `ConsoleLogger`。
- **日志记录**:
  - 在 Service 或 Controller 中实例化 `private readonly logger = new Logger(ClassName.name);`。
  - 使用 `this.logger.log()`, `this.logger.error()`, `this.logger.warn()`。
- **异常日志**: `AllExceptionsFilter` 会自动记录异常堆栈，业务代码中无需手动 catch 打印（除非需要特殊处理）。
- **生产环境**: 生产环境 (`NODE_ENV=production`) 下日志会自动格式化为 JSON。
- **追踪**: 每个请求都会分配唯一的 `requestId`，并包含在日志和响应中，用于链路追踪。

## 6. 数据库 (Database)

- **ORM**: 使用 Prisma Client。
- **Schema**: 定义在 `prisma/schema.prisma`。
- **主键**: 统一使用 String 类型，默认值为 `cuid(2)`。
- **字段命名**: 数据库字段使用 camelCase，例如：`userId`, `contentType`。
- **生成位置**: Client 生成在 `src/generated/prisma`。

## 7. 响应规范 (Response Standards)

- **统一格式**: 所有 API 成功响应会被 `TransformInterceptor` 自动包装：
  ```json
  {
    "success": true,
    "data": { ... }, // 实际返回的数据
    "error": null,
    "requestId": "...",
    "time": "..."
  }
  ```
- **业务开发**: Controller 方法只需返回 `data` 部分的对象，无需手动包装 `success` 等字段。
