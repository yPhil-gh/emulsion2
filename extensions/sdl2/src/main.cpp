#include <SDL2/SDL.h>
#include <libwebsockets.h>
#include <csignal>
#include <cstring>
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>   // <-- add this line

static int exit_requested = 0;
static std::vector<lws*> clients;

// Handle Ctrl+C
void handle_signal(int sig) {
  std::cout << "\nCaught signal " << sig << ", shutting down...\n";
  exit_requested = 1;
}

// Protocol callback
static int callback_controller(struct lws* wsi, enum lws_callback_reasons reason,
                               void* user, void* in, size_t len) {
  switch (reason) {
  case LWS_CALLBACK_ESTABLISHED:
    std::cout << "Client connected\n";
    clients.push_back(wsi);
    break;

  case LWS_CALLBACK_CLOSED:
    std::cout << "Client disconnected\n";
    clients.erase(std::remove(clients.begin(), clients.end(), wsi), clients.end());
    break;

  default:
    break;
  }
  return 0;
}

static struct lws_protocols protocols[] = {
  { "controller-protocol", callback_controller, 0, 1024 },
  { NULL, NULL, 0, 0 }
};

// Broadcast to all connected clients
void broadcast_message(struct lws_context* context, const std::string& msg) {
  for (auto* client : clients) {
    size_t size = LWS_PRE + msg.size();
    std::vector<unsigned char> buf(size);
    std::memcpy(buf.data() + LWS_PRE, msg.c_str(), msg.size());
    lws_write(client, buf.data() + LWS_PRE, msg.size(), LWS_WRITE_TEXT);
  }
}

int main() {
  signal(SIGINT, handle_signal);

  // SDL init
  if (SDL_Init(SDL_INIT_GAMECONTROLLER) < 0) {
    std::cerr << "SDL could not initialize! SDL_Error: " << SDL_GetError() << "\n";
    return 1;
  }

  // LWS context
  struct lws_context_creation_info info;
  memset(&info, 0, sizeof(info));
  info.port = 9002;
  info.protocols = protocols;
  struct lws_context* context = lws_create_context(&info);

  if (!context) {
    std::cerr << "Failed to create libwebsockets context\n";
    return 1;
  }

  std::cout << "WebSocket server started on ws://localhost:9002\n";

  // Main loop
  while (!exit_requested) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
      std::string msg;
      switch (e.type) {
      case SDL_CONTROLLERBUTTONDOWN:
        msg = "{\"type\":\"button_down\",\"button\":" +
          std::to_string(e.cbutton.button) + "}";
        broadcast_message(context, msg);
        break;

      case SDL_CONTROLLERBUTTONUP:
        msg = "{\"type\":\"button_up\",\"button\":" +
          std::to_string(e.cbutton.button) + "}";
        broadcast_message(context, msg);
        break;

      case SDL_CONTROLLERAXISMOTION:
        msg = "{\"type\":\"axis\",\"axis\":" +
          std::to_string(e.caxis.axis) + ",\"value\":" +
          std::to_string(e.caxis.value) + "}";
        broadcast_message(context, msg);
        break;
      }
    }

    // Service WebSocket events
    lws_service(context, 10);
  }

  // Cleanup
  lws_context_destroy(context);
  SDL_Quit();
  std::cout << "Server shut down.\n";
  return 0;
}
