#!/usr/bin/env python3
"""
RAG MCP 工具测试脚本

该脚本用于测试新添加的 RAG 问答系统 MCP 工具是否能正常工作。
"""

import asyncio
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入 MCP 实例
from mcp_instance import mcp

# 导入所有工具
from tools import health_check
from tools import auth_login
from tools import auth_logout
from tools import auth_get_me
from tools import chat
from tools import chat_stream

async def test_health_check():
    """测试健康检查"""
    print("=" * 60)
    print("测试 1: 健康检查")
    print("=" * 60)
    try:
        result = await health_check.health_check()
        print("✓ 健康检查成功")
        print(f"结果: {result[0].text}\n")
        return True
    except Exception as e:
        print(f"✗ 健康检查失败: {e}\n")
        return False

async def test_auth_flow():
    """测试认证流程"""
    print("=" * 60)
    print("测试 2: 用户认证流程")
    print("=" * 60)
    
    # 测试登录
    print("2.1 测试登录...")
    try:
        result = await auth_login.auth_login(
            username="admin",
            password="admin123",
            device_info="Test Script"
        )
        print("✓ 登录成功")
        print(f"结果: {result[0].text[:200]}...\n")
        
        # 从结果中提取 token（这里简化处理，实际应该解析文本）
        text = result[0].text
        token_line = [line for line in text.split('\n') if '访问令牌:' in line]
        if token_line:
            token = token_line[0].split('访问令牌:')[1].strip()
            print(f"获取到 token: {token[:50]}...\n")
            
            # 测试获取用户信息
            print("2.2 测试获取用户信息...")
            try:
                result = await auth_get_me.auth_get_me(token=token)
                print("✓ 获取用户信息成功")
                print(f"结果: {result[0].text}\n")
            except Exception as e:
                print(f"✗ 获取用户信息失败: {e}\n")
                return None
            
            # 测试登出
            print("2.3 测试登出...")
            try:
                result = await auth_logout.auth_logout(token=token)
                print("✓ 登出成功")
                print(f"结果: {result[0].text}\n")
            except Exception as e:
                print(f"✗ 登出失败: {e}\n")
            
            return token
        else:
            print("✗ 无法从登录结果中提取 token\n")
            return None
    except Exception as e:
        print(f"✗ 登录失败: {e}\n")
        return None

async def test_chat(token):
    """测试问答功能"""
    if not token:
        print("跳过问答测试（未获取到有效 token）\n")
        return
    
    print("=" * 60)
    print("测试 3: 问答功能")
    print("=" * 60)
    
    # 测试常规问答
    print("3.1 测试知识库问答...")
    try:
        result = await chat.chat(
            question="什么是RAG？",
            token=token
        )
        print("✓ 知识库问答成功")
        print(f"结果: {result[0].text[:200]}...\n")
    except Exception as e:
        print(f"✗ 知识库问答失败: {e}\n")
    
    # 测试流式问答
    print("3.2 测试流式问答...")
    try:
        result = await chat_stream.chat_stream(
            question="简单介绍一下向量数据库",
            token=token
        )
        print("✓ 流式问答成功")
        print(f"结果: {result[0].text[:200]}...\n")
    except Exception as e:
        print(f"✗ 流式问答失败: {e}\n")

async def main():
    """主测试函数"""
    print("\n" + "=" * 60)
    print("RAG MCP 工具测试")
    print("=" * 60 + "\n")
    
    # 检查环境变量
    backend_url = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
    print(f"后端服务地址: {backend_url}")
    print(f"确保后端服务已启动: python backend/run_server.sh\n")
    
    # 运行测试
    await test_health_check()
    token = await test_auth_flow()
    await test_chat(token)
    
    print("=" * 60)
    print("测试完成！")
    print("=" * 60 + "\n")
    
    print("注意事项:")
    print("1. 如果测试失败，请确保后端服务已启动")
    print("2. 默认后端地址为 http://localhost:8000")
    print("3. 可以在 .env 文件中配置 BACKEND_BASE_URL")
    print("4. 测试使用的默认账号为 admin/admin123\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n测试被用户中断")
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")
