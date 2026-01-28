# config.py

# 语雀团队TOKEN
YUQUE_TOKEN = "A8Pdf8YCJ7E0cttespGPu1mgutUhozau4u967AFz"
# 语雀团队 login（仅团队标识），如果YUQUE_NAMESPACE为空将获取整个团队的所有知识库。
YUQUE_GROUP = "cychenhaibin"
# 知识库 namespace，格式为"团队login/知识库slug"，填写后只会获取单一知识库的文档。
# 使用 list_repos.py 脚本可以查看所有可用的知识库及其 namespace
# YUQUE_NAMESPACE = "cychenhaibin/face"  # FE 面试小站
YUQUE_NAMESPACE = None  # 设置为 None 则获取整个团队的所有知识库

# 开启问答模式，在存在索引的情况下避免重建。若要更新知识库索引及文本，请关闭该模式。
QA_MODE = True

# 是否使用 OpenAI 接口（兼容支持OPENAPI的模型，False则使用Ollama）
USE_OPENAI = True

# 检索参数，TOP_K_INITIAL控制检索出的文本段数，TOP_K_RERANK控制重排序后返回的文本段数
TOP_K_INITIAL = 20
TOP_K_RERANK = 10

# 通用 OpenAI API 配置
# DeepSeek（已停用，余额不足）
# OPENAI_API_KEY = "sk-45ecf5c06d084ae99cf7e9c3b84122e5"
# OPENAI_MODEL = "deepseek-chat"  # 或 "gpt-3.5-turbo"
# OPENAI_API_BASE = "https://api.deepseek.com/v1"  # DeepSeek 的地址
# OPENAI_MAX_TOKENS = 8192

# 使用硅基流动（免费额度 2000万 tokens）
# 1. 访问 https://siliconflow.cn 注册
# 2. 进入控制台 -> API 管理 -> 创建密钥
# 3. 将下面的 "你的硅基流动API密钥" 替换成你获取的 API Key
USE_OPENAI = True
OPENAI_API_KEY = "sk-chwircetkhnzrgdxpqzetmvjmbhgcqsyrbbgzzugbnojumud"  # ← 在这里填入你的 API Key（格式：sk-xxxxxx）
OPENAI_MODEL = "Qwen/Qwen2.5-7B-Instruct"  # 推荐：中文能力强，速度快，¥0.5/百万tokens
OPENAI_API_BASE = "https://api.siliconflow.cn/v1"
OPENAI_MAX_TOKENS = 8192

# 其他可选模型：
# OPENAI_MODEL = "deepseek-ai/DeepSeek-V3"  # 最强推理，¥2.0/百万tokens
# OPENAI_MODEL = "Qwen/Qwen2.5-72B-Instruct"  # 更强大，¥4.0/百万tokens

# Ollama 模型配置
OLLAMA_MODEL = "deepseek-r1:7b"
OLLAMA_MAX_TOKENS = 4096

# 检索模型相关
BC_EMBED_MODEL = "maidalun1020/bce-embedding-base_v1"
BC_RERANK_MODEL = "maidalun1020/bce-reranker-base_v1"
VECTOR_DIM = 768
FAISS_INDEX_PATH = "./vectorstore/faiss.index"

# 模型缓存目录（下载的模型文件存放位置）
MODEL_CACHE_DIR = "./models"

