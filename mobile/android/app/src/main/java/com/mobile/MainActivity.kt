package com.mobile

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "mobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * 全面屏适配：使应用内容延伸至系统栏下方
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    
    // 设置窗口标志，使内容延伸到系统栏下方
    WindowCompat.setDecorFitsSystemWindows(window, false)
    
    // 设置状态栏和导航栏为透明
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      window.statusBarColor = android.graphics.Color.TRANSPARENT
      window.navigationBarColor = android.graphics.Color.TRANSPARENT
    }
    
    // 设置窗口标志，确保内容可以绘制在系统栏下方
    window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
    window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
    window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
    
    // 系统栏图标颜色由 React Native StatusBar 组件的 barStyle 属性控制
  }
}
