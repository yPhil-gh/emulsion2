#include <SDL2/SDL.h>
#include <iostream>

int main() {
  if (SDL_Init(SDL_INIT_GAMECONTROLLER) < 0) {
    std::cerr << "SDL Init failed: " << SDL_GetError() << std::endl;
    return 1;
  }

  SDL_GameController *controller = nullptr;
  for (int i = 0; i < SDL_NumJoysticks(); ++i) {
    if (SDL_IsGameController(i)) {
      controller = SDL_GameControllerOpen(i);
      if (controller) {
        std::cout << "Controller opened: " << SDL_GameControllerName(controller) << std::endl;
        break;
      }
    }
  }

  if (!controller) {
    std::cerr << "No controller found." << std::endl;
    SDL_Quit();
    return 0;
  }

  bool running = true;
  bool sharePressed = false;

  while (running) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
      if (e.type == SDL_QUIT) {
        running = false;
      }
      else if (e.type == SDL_CONTROLLERBUTTONDOWN) {
        if (e.cbutton.button == SDL_CONTROLLER_BUTTON_BACK) {
          sharePressed = true;
        }
        if (e.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_UP && sharePressed) {
          std::cout << "KILL_EMULATOR" << std::endl;
          std::cout.flush();
        }
      }
      else if (e.type == SDL_CONTROLLERBUTTONUP) {
        if (e.cbutton.button == SDL_CONTROLLER_BUTTON_BACK) {
          sharePressed = false;
        }
      }
    }
    SDL_Delay(10); // keep CPU calm
  }

  if (controller) SDL_GameControllerClose(controller);
  SDL_Quit();
  return 0;
}
